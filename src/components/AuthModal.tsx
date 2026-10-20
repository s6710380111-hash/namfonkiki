import React, { useState } from 'react';
import {
  X,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login'
}) => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword } = useAuth();
  const { success, error, info } = useToast();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      error('กรุณากรอกอีเมล');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        if (!password) {
          error('กรุณากรอกรหัสผ่าน');
          setLoading(false);
          return;
        }
        await signInWithEmail(email, password);
        success('เข้าสู่ระบบสำเร็จ', 'ยินดีต้อนรับกลับสู่ EduShare Hub');
        onClose();
      } else if (mode === 'register') {
        if (!displayName.trim()) {
          error('กรุณาระบุชื่อ-นามสกุล หรือชื่อที่ต้องการแสดง');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          error('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          error('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
          setLoading(false);
          return;
        }

        await signUpWithEmail(email, password, displayName);
        success(
          'สมัครสมาชิกสำเร็จ!',
          'ระบบได้ส่งอีเมลยืนยันตัวตนไปยังที่อยู่อีเมลของคุณแล้ว'
        );
        onClose();
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setResetSent(true);
        success(
          'ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว',
          'กรุณาตรวจสอบกล่องจดหมายอีเมลของคุณเพื่อตั้งรหัสผ่านใหม่'
        );
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = 'เกิดข้อผิดพลาดในการดำเนินการ';
      if (err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        errMsg = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      } else if (err?.code === 'auth/email-already-in-use') {
        errMsg = 'อีเมลนี้ถูกใช้งานแล้วในระบบ กรุณาเข้าสู่ระบบ';
      } else if (err?.code === 'auth/weak-password') {
        errMsg = 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
      } else if (err?.code === 'auth/invalid-email') {
        errMsg = 'รูปแบบอีเมลไม่ถูกต้อง';
      } else if (err?.message) {
        errMsg = err.message;
      }
      error('การเข้าสู่ระบบไม่สำเร็จ', errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      success('เข้าสู่ระบบด้วย Google สำเร็จ');
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        error('เข้าสู่ระบบด้วย Google ไม่สำเร็จ', err?.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        
        {/* Top Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              E
            </div>
            <h3 className="font-extrabold text-slate-800 text-lg">
              {mode === 'login' ? 'เข้าสู่ระบบ' : mode === 'register' ? 'สมัครสมาชิกใหม่' : 'ลืมรหัสผ่าน'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        {mode !== 'forgot' && (
          <div className="px-6 mb-4">
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'login' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                เข้าสู่ระบบ
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'register' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                สมัครสมาชิก
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="px-6 pb-6 space-y-4">
          {/* Google Sign In Button */}
          {mode !== 'forgot' && (
            <>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>ดำเนินการต่อด้วยบัญชี Google</span>
              </button>

              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-3 text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                  หรือใช้อีเมล
                </span>
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อ-นามสกุล / ชื่อผู้ใช้ <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="เช่น สมชาย ใจดี หรือ ครูสมปอง"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ที่อยู่อีเมล <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    รหัสผ่าน <span className="text-rose-500">*</span>
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      ลืมรหัสผ่าน?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ความยาวอย่างน้อย 6 ตัวอักษร"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ยืนยันรหัสผ่านอีกครั้ง <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่านซ้ำอีกครั้ง"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {mode === 'forgot' && resetSent && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>ส่งอีเมลรีเซ็ตรหัสผ่านเรียบร้อย โปรดตรวจสอบกล่องข้อความหรือถังขยะ</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังดำเนินการ...</span>
                </>
              ) : mode === 'login' ? (
                <span>เข้าสู่ระบบ</span>
              ) : mode === 'register' ? (
                <span>สมัครสมาชิก</span>
              ) : (
                <span>ส่งลิงก์ตั้งรหัสผ่านใหม่</span>
              )}
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 pt-2"
              >
                กลับไปหน้าเข้าสู่ระบบ
              </button>
            )}
          </form>
        </div>

      </div>
    </div>
  );
};
