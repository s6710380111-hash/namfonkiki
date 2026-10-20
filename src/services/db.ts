import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
  onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from './firebase';
import {
  Resource,
  FavoriteItem,
  ContentReport,
  ModerationLog,
  SiteSettings,
  UserProfile,
  UserRole,
  UserStatus,
  FilterState
} from '../types';

export const DEFAULT_CATEGORIES = [
  'คอมพิวเตอร์และเทคโนโลยี',
  'วิทยาศาสตร์และชีววิทยา',
  'คณิตศาสตร์',
  'ภาษาต่างประเทศ',
  'ภาษาไทยและวรรณคดี',
  'สังคมศึกษาและประวัติศาสตร์',
  'ศิลปะและดนตรี',
  'การเงินและการบริหาร',
  'การเตรียมสอบและการศึกษาต่อ',
  'อื่นๆ'
];

export const DEFAULT_GRADE_LEVELS = [
  'ทุกระดับชั้น',
  'ประถมศึกษา',
  'มัธยมศึกษาตอนต้น',
  'มัธยมศึกษาตอนปลาย',
  'อุดมศึกษา/มหาวิทยาลัย',
  'ครูและอาจารย์',
  'บุคคลทั่วไป'
];

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'EduShare Hub - คลังแบ่งปันความรู้เพื่อการเรียนรู้',
  siteDescription: 'ศูนย์กลางรวบรวมและแบ่งปันสื่อการสอน สรุปบทเรียน และความรู้คุณภาพสำหรับนักเรียน นักศึกษา และคุณครู',
  announcement: 'ยินดีต้อนรับสู่ EduShare Hub! ร่วมแบ่งปันเอกสารการเรียนและสื่อการสอนเพื่อสร้างสังคมแห่งการเรียนรู้ร่วมกัน',
  announcementActive: true,
  categories: DEFAULT_CATEGORIES,
  allowRegistration: true,
  contactEmail: 'contact@edushare.ac.th',
  updatedBy: 'system',
  updatedAt: new Date().toISOString()
};

// ==========================================
// Settings Operations
// ==========================================
export async function getSiteSettings(): Promise<SiteSettings> {
  const docRef = doc(db, 'settings', 'siteConfig');
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as SiteSettings;
    } else {
      // Seed default settings
      await setDoc(docRef, DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'settings/siteConfig');
  }
}

export async function updateSiteSettings(settings: Partial<SiteSettings>, adminId: string): Promise<void> {
  const docRef = doc(db, 'settings', 'siteConfig');
  try {
    await updateDoc(docRef, {
      ...settings,
      updatedBy: adminId,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, 'settings/siteConfig');
  }
}

// ==========================================
// Resources Operations
// ==========================================
export async function getResources(filter?: Partial<FilterState>): Promise<Resource[]> {
  const colRef = collection(db, 'resources');
  try {
    // We query published resources
    const snap = await getDocs(colRef);
    let items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Resource));

    // Client-side filtering for robust multilingual search
    if (filter) {
      if (filter.searchQuery && filter.searchQuery.trim()) {
        const q = filter.searchQuery.toLowerCase().trim();
        items = items.filter(r =>
          (r.title && r.title.toLowerCase().includes(q)) ||
          (r.description && r.description.toLowerCase().includes(q)) ||
          (r.authorName && r.authorName.toLowerCase().includes(q)) ||
          (r.category && r.category.toLowerCase().includes(q)) ||
          (r.tags && r.tags.some(t => t.toLowerCase().includes(q)))
        );
      }

      if (filter.category && filter.category !== 'all' && filter.category !== 'ทั้งหมด') {
        items = items.filter(r => r.category === filter.category);
      }

      if (filter.gradeLevel && filter.gradeLevel !== 'all' && filter.gradeLevel !== 'ทุกระดับชั้น') {
        items = items.filter(r => r.gradeLevel === filter.gradeLevel || r.gradeLevel === 'ทุกระดับชั้น');
      }

      if (filter.mediaType && filter.mediaType !== 'all') {
        items = items.filter(r => r.mediaType === filter.mediaType);
      }

      // Sort
      if (filter.sortBy === 'popular') {
        items.sort((a, b) => (b.favoriteCount || 0) - (a.favoriteCount || 0));
      } else if (filter.sortBy === 'views') {
        items.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
      } else {
        // default newest
        items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      }
    }

    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'resources');
  }
}

export async function getResourceById(id: string): Promise<Resource | null> {
  const docRef = doc(db, 'resources', id);
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Resource;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `resources/${id}`);
  }
}

export async function createResource(data: Omit<Resource, 'id' | 'viewCount' | 'favoriteCount' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const colRef = collection(db, 'resources');
  try {
    const docData = {
      ...data,
      viewCount: 0,
      favoriteCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const ref = await addDoc(colRef, docData);
    return ref.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'resources');
  }
}

export async function updateResource(id: string, data: Partial<Resource>): Promise<void> {
  const docRef = doc(db, 'resources', id);
  try {
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `resources/${id}`);
  }
}

export async function deleteResource(id: string): Promise<void> {
  const docRef = doc(db, 'resources', id);
  try {
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `resources/${id}`);
  }
}

export async function incrementViewCount(id: string): Promise<void> {
  const docRef = doc(db, 'resources', id);
  try {
    await updateDoc(docRef, {
      viewCount: increment(1)
    });
  } catch (err) {
    // Non-blocking for analytics
    console.warn('View count update error', err);
  }
}

// ==========================================
// Favorites Operations (with UID synchronization)
// ==========================================
export async function getUserFavorites(userId: string): Promise<FavoriteItem[]> {
  const colRef = collection(db, 'favorites');
  try {
    const q = query(colRef, where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FavoriteItem));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'favorites');
  }
}

export async function toggleFavorite(
  userId: string,
  resource: { id: string; title: string; category: string; mediaType: string }
): Promise<boolean> {
  const favDocId = `${userId}_${resource.id}`;
  const docRef = doc(db, 'favorites', favDocId);
  const resourceRef = doc(db, 'resources', resource.id);

  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      // Remove favorite
      await deleteDoc(docRef);
      try {
        await updateDoc(resourceRef, { favoriteCount: increment(-1) });
      } catch (e) {
        // Safe fallback
      }
      return false; // Now unfavorited
    } else {
      // Add favorite
      await setDoc(docRef, {
        userId,
        resourceId: resource.id,
        resourceTitle: resource.title,
        resourceCategory: resource.category,
        resourceMediaType: resource.mediaType,
        createdAt: new Date().toISOString()
      });
      try {
        await updateDoc(resourceRef, { favoriteCount: increment(1) });
      } catch (e) {
        // Safe fallback
      }
      return true; // Now favorited
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `favorites/${favDocId}`);
  }
}

// ==========================================
// Reports Operations
// ==========================================
export async function submitReport(data: Omit<ContentReport, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const colRef = collection(db, 'reports');
  try {
    const reportData = {
      ...data,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const ref = await addDoc(colRef, reportData);
    return ref.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'reports');
  }
}

export async function getAllReports(): Promise<ContentReport[]> {
  const colRef = collection(db, 'reports');
  try {
    const snap = await getDocs(colRef);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ContentReport));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'reports');
  }
}

export async function updateReportStatus(
  reportId: string,
  status: 'resolved' | 'dismissed',
  moderatorId: string,
  resolutionNote: string
): Promise<void> {
  const docRef = doc(db, 'reports', reportId);
  try {
    await updateDoc(docRef, {
      status,
      resolvedBy: moderatorId,
      resolutionNote,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `reports/${reportId}`);
  }
}

// ==========================================
// Moderation Logs
// ==========================================
export async function logModerationAction(log: Omit<ModerationLog, 'id' | 'createdAt'>): Promise<void> {
  const colRef = collection(db, 'moderationLogs');
  try {
    await addDoc(colRef, {
      ...log,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    // Don't crash if log fails
    console.warn('Moderation log write warning', err);
  }
}

export async function getModerationLogs(): Promise<ModerationLog[]> {
  const colRef = collection(db, 'moderationLogs');
  try {
    const snap = await getDocs(colRef);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ModerationLog));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'moderationLogs');
  }
}

// ==========================================
// Users Management
// ==========================================
export async function getAllUsers(): Promise<UserProfile[]> {
  const colRef = collection(db, 'users');
  try {
    const snap = await getDocs(colRef);
    return snap.docs.map(d => d.data() as UserProfile);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'users');
  }
}

export async function updateUserRole(userId: string, newRole: UserRole): Promise<void> {
  const docRef = doc(db, 'users', userId);
  try {
    await updateDoc(docRef, {
      role: newRole,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
  }
}

export async function updateUserStatus(userId: string, newStatus: UserStatus): Promise<void> {
  const docRef = doc(db, 'users', userId);
  try {
    await updateDoc(docRef, {
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
  }
}

// ==========================================
// File Upload via Firebase Storage
// ==========================================
export async function uploadFileToStorage(
  file: File,
  folder: string = 'uploads',
  onProgress?: (percent: number) => void
): Promise<{ url: string; fileName: string; fileSize: number }> {
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storageRef = ref(storage, `${folder}/${timestamp}_${sanitizedName}`);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(Math.round(progress));
      },
      (error) => {
        console.error('Storage Upload Error: ', error);
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({
          url: downloadURL,
          fileName: file.name,
          fileSize: file.size
        });
      }
    );
  });
}

// Initial seed if empty
export async function seedInitialResourcesIfEmpty(authorUid: string, authorName: string, authorEmail: string) {
  try {
    const existing = await getDocs(collection(db, 'resources'));
    if (existing.empty) {
      const initialResources: Omit<Resource, 'id'>[] = [
        {
          title: 'คู่มือการเขียนโปรแกรม Python สำหรับผู้เริ่มต้นและโครงงานนักเรียน',
          description: 'เอกสารสรุปไวยากรณ์ Python พื้นฐาน ตั้งแต่ตัวแปร, เงื่อนไข, วนซ้ำ, ฟังก์ชัน ไปจนถึงการเขียนโปรแกรมเชื่อมต่อเซนเซอร์และวิเคราะห์ข้อมูลเบื้องต้น เหมาะสำหรับนักเรียนระดับ ม.ต้น - ม.ปลาย',
          category: 'คอมพิวเตอร์และเทคโนโลยี',
          gradeLevel: 'มัธยมศึกษาตอนปลาย',
          mediaType: 'pdf',
          fileUrl: 'https://docs.python.org/3/tutorial/',
          fileName: 'python_starter_guide.pdf',
          authorId: authorUid,
          authorName: authorName,
          authorEmail: authorEmail,
          viewCount: 142,
          favoriteCount: 28,
          status: 'published',
          tags: ['Python', 'Coding', 'วิทยาการคำนวณ', 'Programming'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          title: 'วิดีโอติวสรุปเข้ม: แคลคูลัสพื้นฐาน ลิมิตและอนุพันธ์ เข้าใจง่ายใน 30 นาที',
          description: 'สรุปคอนเซปต์แคลคูลัส 1 เรื่อง Limit and Continuity และการหา Differentiation ด้วยสูตรลัดพร้อมตัวอย่างโจทย์สอบเข้ามหาวิทยาลัย',
          category: 'คณิตศาสตร์',
          gradeLevel: 'มัธยมศึกษาตอนปลาย',
          mediaType: 'video',
          fileUrl: 'https://www.youtube.com/watch?v=WUvTyaaNkzM',
          fileName: 'Calculus_Summary_Part1.mp4',
          authorId: authorUid,
          authorName: authorName,
          authorEmail: authorEmail,
          viewCount: 310,
          favoriteCount: 45,
          status: 'published',
          tags: ['คณิตศาสตร์', 'แคลคูลัส', 'ม.ปลาย', 'สรุปบทเรียน'],
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          title: 'คลังคำศัพท์ภาษาอังกฤษ Academic Vocabulary 500 คำ สำหรับสอบ IELTS / TCAS',
          description: 'รวมคำศัพท์เชิงวิชาการพร้อมตัวอย่างประโยค การใช้ Collocation และ Synonyms จัดเป็นหมวดหมู่ 20 หมวดเพื่อเตรียมสอบเข้ามหาวิทยาลัยและสอบวัดระดับ',
          category: 'ภาษาต่างประเทศ',
          gradeLevel: 'อุดมศึกษา/มหาวิทยาลัย',
          mediaType: 'document',
          fileUrl: 'https://www.oxfordlearnersdictionaries.com/wordlists/academic-wordlist',
          fileName: 'Academic_Vocab_500.docx',
          authorId: authorUid,
          authorName: authorName,
          authorEmail: authorEmail,
          viewCount: 220,
          favoriteCount: 39,
          status: 'published',
          tags: ['English', 'TCAS', 'IELTS', 'Vocabulary'],
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date(Date.now() - 172800000).toISOString()
        },
        {
          title: 'แผนภาพสรุปชีววิทยา: เซลล์สัตว์และเซลล์พืช พร้อมการลำเลียงสารผ่านเซลล์',
          description: 'สรุปโครงสร้างออร์แกเนลล์ หน้าที่ และกระบวนการ Diffusion, Osmosis, Active Transport ด้วยอินโฟกราฟิกสีสันสดใส เข้าใจง่าย',
          category: 'วิทยาศาสตร์และชีววิทยา',
          gradeLevel: 'มัธยมศึกษาตอนต้น',
          mediaType: 'image',
          fileUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/48/Animal_cell_structure_en.svg',
          fileName: 'Cell_Biology_Summary.png',
          authorId: authorUid,
          authorName: authorName,
          authorEmail: authorEmail,
          viewCount: 185,
          favoriteCount: 31,
          status: 'published',
          tags: ['ชีววิทยา', 'เซลล์', 'วิทยาศาสตร์', 'สรุป'],
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          updatedAt: new Date(Date.now() - 259200000).toISOString()
        }
      ];

      for (const res of initialResources) {
        await addDoc(collection(db, 'resources'), res);
      }
      console.log('Seeded initial educational resources successfully.');
    }
  } catch (e) {
    console.log('Resource check complete:', e);
  }
}
