import React, { useState } from 'react';
import {
  GraduationCap,
  PlusCircle,
  Bookmark,
  FileText,
  ShieldCheck,
  LogOut,
  User,
  Menu,
  X,
  Search,
  Bell,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SiteSettings } from '../types';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAuthModal: () => void;
  onOpenPostModal: () => void;
  siteSettings: SiteSettings | null;
  favoritesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAuthModal,
  onOpenPostModal,
  siteSettings,
  favoritesCount
}) => {
  const { user, profile, isAdmin, isModerator, logout } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (tab: string) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-sky-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Brand Logo & Name */}
          <div
            onClick={() => handleNav('home')}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg bg-gradient-to-r from-blue-900 via-blue-800 to-sky-600 bg-clip-text text-transparent">
                  {siteSettings?.siteName ? siteSettings.siteName.split('-')[0].trim() : 'EduShare Hub'}
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 hidden sm:inline-block">
                  คลังความรู้
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block leading-none">
                แบ่งปันและเรียนรู้ร่วมกัน
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 font-medium text-sm text-slate-600">
            <button
              onClick={() => handleNav('home')}
              className={`px-3.5 py-2 rounded-lg transition-all ${
                currentTab === 'home'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'hover:text-blue-600 hover:bg-slate-50'
              }`}
            >
              หน้าแรก
            </button>
            <button
              onClick={() => handleNav('explore')}
              className={`px-3.5 py-2 rounded-lg transition-all ${
                currentTab === 'explore'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'hover:text-blue-600 hover:bg-slate-50'
              }`}
            >
              คลังความรู้ทั้งหมด
            </button>
            {user && (
              <>
                <button
                  onClick={() => handleNav('favorites')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
                    currentTab === 'favorites'
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : 'hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                  <span>รายการโปรด</span>
                  {favoritesCount > 0 && (
                    <span className="text-xs px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 font-bold">
                      {favoritesCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleNav('my-posts')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
                    currentTab === 'my-posts'
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : 'hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>สื่อของฉัน</span>
                </button>
              </>
            )}
            {(isAdmin || isModerator) && (
              <button
                onClick={() => handleNav('admin')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
                  currentTab === 'admin'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'hover:text-indigo-600 hover:bg-indigo-50/50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>แอดมิน</span>
              </button>
            )}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Create Post Button */}
            <button
              onClick={onOpenPostModal}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">แบ่งปันความรู้</span>
              <span className="sm:hidden">โพสต์</span>
            </button>

            {/* User Profile or Login */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all text-slate-700"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm overflow-hidden">
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
                    ) : (
                      (profile?.displayName || user.email || 'U')[0].toUpperCase()
                    )}
                  </div>
                  <div className="text-left hidden lg:block pr-1">
                    <p className="text-xs font-semibold text-slate-800 leading-tight max-w-[120px] truncate">
                      {profile?.displayName || user.email?.split('@')[0]}
                    </p>
                    <span className="text-[10px] text-blue-600 capitalize">
                      {profile?.role === 'admin' ? 'ผู้ดูแลระบบ' : profile?.role === 'moderator' ? 'ผู้ตรวจสอบ' : 'สมาชิก'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-medium text-slate-500">เข้าสู่ระบบด้วย</p>
                      <p className="text-xs font-semibold text-slate-800 truncate">{user.email}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          profile?.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : profile?.role === 'moderator'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {profile?.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : profile?.role === 'moderator' ? 'ผู้ตรวจสอบ' : 'สมาชิกทั่วไป'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleNav('favorites')}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Bookmark className="w-4 h-4 text-slate-400" />
                      รายการโปรดที่บันทึกไว้
                    </button>
                    <button
                      onClick={() => handleNav('my-posts')}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-slate-400" />
                      สื่อความรู้ที่ฉันแชร์
                    </button>
                    {(isAdmin || isModerator) && (
                      <button
                        onClick={() => handleNav('admin')}
                        className="w-full text-left px-4 py-2 text-xs text-indigo-700 hover:bg-indigo-50 font-medium flex items-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        แผงควบคุมระบบ (Admin Panel)
                      </button>
                    )}
                    <div className="border-t border-slate-100 my-1"></div>
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      ออกจากระบบ
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm border border-blue-200 text-blue-700 hover:bg-blue-50 transition-all"
              >
                <User className="w-4 h-4" />
                <span>เข้าสู่ระบบ</span>
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="เมนู"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 shadow-lg">
          <div className="flex flex-col gap-1.5 font-medium text-sm text-slate-700">
            <button
              onClick={() => handleNav('home')}
              className={`text-left px-3 py-2 rounded-lg ${
                currentTab === 'home' ? 'bg-blue-50 text-blue-700 font-semibold' : ''
              }`}
            >
              หน้าแรก
            </button>
            <button
              onClick={() => handleNav('explore')}
              className={`text-left px-3 py-2 rounded-lg ${
                currentTab === 'explore' ? 'bg-blue-50 text-blue-700 font-semibold' : ''
              }`}
            >
              คลังความรู้ทั้งหมด
            </button>
            {user ? (
              <>
                <button
                  onClick={() => handleNav('favorites')}
                  className="text-left px-3 py-2 rounded-lg flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-blue-600" />
                    รายการโปรด
                  </span>
                  {favoritesCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {favoritesCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleNav('my-posts')}
                  className="text-left px-3 py-2 rounded-lg flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  สื่อของฉัน
                </button>
                {(isAdmin || isModerator) && (
                  <button
                    onClick={() => handleNav('admin')}
                    className="text-left px-3 py-2 rounded-lg text-indigo-700 bg-indigo-50/50 flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    ระบบจัดการผู้ดูแล (Admin Dashboard)
                  </button>
                )}
                <div className="border-t border-slate-100 my-2 pt-2">
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-left px-3 py-2 text-rose-600 flex items-center gap-2 w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    ออกจากระบบ
                  </button>
                </div>
              </>
            ) : (
              <div className="pt-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuthModal();
                  }}
                  className="w-full text-center py-2.5 rounded-xl bg-blue-600 text-white font-medium"
                >
                  เข้าสู่ระบบ / สมัครสมาชิก
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
