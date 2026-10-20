import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../services/firebase';
import { UserProfile, UserRole } from '../types';

// The designated bootstrap administrator email
const SUPER_ADMIN_EMAIL = 's6710380111@pkru.ac.th';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isMember: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync or create user profile document in Firestore
  const syncUserProfile = async (fbUser: FirebaseUser): Promise<UserProfile> => {
    const userDocRef = doc(db, 'users', fbUser.uid);
    try {
      const snap = await getDoc(userDocRef);
      const isSuperAdmin = (fbUser.email || '').toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        // Auto-promote bootstrapped admin if needed
        if (isSuperAdmin && data.role !== 'admin') {
          await updateDoc(userDocRef, {
            role: 'admin',
            updatedAt: new Date().toISOString()
          });
          data.role = 'admin';
        }
        setProfile(data);
        return data;
      } else {
        const newProfile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'ผู้ใช้งาน',
          photoURL: fbUser.photoURL || '',
          role: isSuperAdmin ? 'admin' : 'member',
          status: 'active',
          bio: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setDoc(userDocRef, newProfile);
        setProfile(newProfile);
        return newProfile;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`);
    }
  };

  const refreshProfile = async () => {
    if (auth.currentUser) {
      await syncUserProfile(auth.currentUser);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        try {
          const prof = await syncUserProfile(fbUser);
          if (prof.status === 'suspended') {
            await signOut(auth);
            setUser(null);
            setProfile(null);
            alert('บัญชีของคุณถูกระงับการใช้งานชั่วคราว กรุณาติดต่อผู้ดูแลระบบ');
          }
        } catch (err) {
          console.error('Failed to sync profile', err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await syncUserProfile(result.user);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
    if (result.user) {
      await syncUserProfile(result.user);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, displayName: string) => {
    const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (result.user) {
      // Set display name in auth
      await updateProfile(result.user, { displayName: displayName.trim() });
      // Send real verification email
      try {
        await sendEmailVerification(result.user);
      } catch (e) {
        console.warn('Failed to send verification email immediately', e);
      }
      // Create user doc
      await syncUserProfile(result.user);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const resendVerificationEmail = async () => {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const isAdmin = profile?.role === 'admin' || (user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase());
  const isModerator = isAdmin || profile?.role === 'moderator';
  const isMember = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        isModerator,
        isMember,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        resendVerificationEmail,
        logout,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
