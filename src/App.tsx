import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Bookmark,
  GraduationCap,
  Sparkles,
  BookOpen,
  ArrowUpDown,
  RefreshCw,
  PlusCircle,
  Heart
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import {
  Resource,
  FavoriteItem,
  SiteSettings,
  FilterState,
  GradeLevel,
  MediaType
} from './types';
import {
  getResources,
  getUserFavorites,
  toggleFavorite,
  getSiteSettings,
  deleteResource,
  seedInitialResourcesIfEmpty,
  DEFAULT_CATEGORIES,
  DEFAULT_GRADE_LEVELS
} from './services/db';

import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { CategoriesBar } from './components/CategoriesBar';
import { Breadcrumb, BreadcrumbItem } from './components/Breadcrumb';
import { ResourceCard } from './components/ResourceCard';
import { ResourceDetailModal } from './components/ResourceDetailModal';
import { PostResourceModal } from './components/PostResourceModal';
import { ReportModal } from './components/ReportModal';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { FavoritesView } from './components/FavoritesView';
import { MyResourcesView } from './components/MyResourcesView';
import { EmptyState } from './components/EmptyState';
import { LoadingSkeleton } from './components/LoadingSkeleton';

function MainApp() {
  const { user, profile, isAdmin, isModerator } = useAuth();
  const { success, error, info } = useToast();

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<'home' | 'explore' | 'favorites' | 'my-posts' | 'admin'>('home');

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [reportResource, setReportResource] = useState<Resource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);

  // Data states
  const [resources, setResources] = useState<Resource[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [loadingResources, setLoadingResources] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedMediaType, setSelectedMediaType] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'views'>('newest');

  // Load site settings & seed default data once
  const loadSettingsAndSeed = async () => {
    try {
      const s = await getSiteSettings();
      setSiteSettings(s);
      // Seed rich Thai educational starter resources if empty
      await seedInitialResourcesIfEmpty(
        'system-educator',
        'ครูต้นแบบ EduShare',
        'educator@edushare.ac.th'
      );
    } catch (err) {
      console.error('Settings load error', err);
    }
  };

  // Fetch published resources
  const fetchResources = async () => {
    setLoadingResources(true);
    try {
      const data = await getResources({
        searchQuery,
        category: selectedCategory,
        gradeLevel: selectedGrade,
        mediaType: selectedMediaType,
        sortBy
      });
      // Show only published unless admin/mod
      const visible = data.filter((r) => r.status === 'published' || isAdmin || isModerator || r.authorId === user?.uid);
      setResources(visible);
    } catch (err: any) {
      console.error(err);
      error('ไม่สามารถโหลดข้อมูลสื่อการสอนได้', err?.message);
    } finally {
      setLoadingResources(false);
    }
  };

  // Fetch favorites for logged in user
  const fetchFavorites = async () => {
    if (!user) {
      setFavorites([]);
      return;
    }
    try {
      const favs = await getUserFavorites(user.uid);
      setFavorites(favs);
    } catch (err) {
      console.error('Failed to load favorites', err);
    }
  };

  useEffect(() => {
    loadSettingsAndSeed();
  }, []);

  useEffect(() => {
    fetchResources();
  }, [selectedCategory, selectedGrade, selectedMediaType, sortBy]);

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  // Fast O(1) set of favorited IDs
  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.resourceId)), [favorites]);

  // Categories count
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    resources.forEach((r) => {
      if (r.category) {
        counts[r.category] = (counts[r.category] || 0) + 1;
      }
    });
    return counts;
  }, [resources]);

  // Toggle favorite action
  const handleToggleFavorite = async (res: Resource) => {
    if (!user) {
      info('โปรดเข้าสู่ระบบ', 'กรุณาเข้าสู่ระบบเพื่อบันทึกสื่อที่คุณชื่นชอบลงในรายการโปรด');
      setAuthModalOpen(true);
      return;
    }

    try {
      const isNowFav = await toggleFavorite(user.uid, {
        id: res.id,
        title: res.title,
        category: res.category,
        mediaType: res.mediaType
      });

      if (isNowFav) {
        success('บันทึกในรายการโปรดแล้ว', `"${res.title}" ถูกจัดเก็บในรายการโปรดของคุณ`);
      } else {
        info('นำออกจากรายการโปรดแล้ว');
      }

      await fetchFavorites();
      // Update local card counts
      setResources((prev) =>
        prev.map((item) =>
          item.id === res.id
            ? { ...item, favoriteCount: Math.max(0, (item.favoriteCount || 0) + (isNowFav ? 1 : -1)) }
            : item
        )
      );
    } catch (err: any) {
      console.error(err);
      error('ไม่สามารถบันทึกรายการโปรดได้', err?.message);
    }
  };

  // Edit / Delete handlers
  const handleEditResource = (res: Resource) => {
    setEditingResource(res);
    setPostModalOpen(true);
  };

  const handleDeleteResource = async (res: Resource) => {
    setDeleteTarget(res);
  };

  const confirmDeleteResource = async () => {
    if (!deleteTarget) return;
    try {
      await deleteResource(deleteTarget.id);
      success('ลบสื่อการสอนเรียบร้อยแล้ว');
      setDeleteTarget(null);
      if (selectedResource?.id === deleteTarget.id) {
        setSelectedResource(null);
      }
      fetchResources();
      fetchFavorites();
    } catch (err: any) {
      error('ไม่สามารถลบสื่อได้', err?.message);
    }
  };

  // Search handler
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResources();
    if (currentTab !== 'explore' && currentTab !== 'home') {
      setCurrentTab('explore');
    }
  };

  // Filtered list for user's own posts
  const myResources = useMemo(() => {
    if (!user) return [];
    return resources.filter((r) => r.authorId === user.uid);
  }, [resources, user]);

  // Filtered list for favorites view
  const favoriteResources = useMemo(() => {
    return resources.filter((r) => favoriteIds.has(r.id));
  }, [resources, favoriteIds]);

  // Dynamic breadcrumb items
  const breadcrumbItems = useMemo(() => {
    const list: BreadcrumbItem[] = [{ label: 'หน้าแรก', action: () => setCurrentTab('home') }];

    if (currentTab === 'explore') {
      list.push({
        label: selectedCategory === 'all' ? 'คลังความรู้ทั้งหมด' : selectedCategory,
        active: true
      });
    } else if (currentTab === 'favorites') {
      list.push({ label: 'รายการโปรดของฉัน', active: true });
    } else if (currentTab === 'my-posts') {
      list.push({ label: 'สื่อที่ฉันแบ่งปัน', active: true });
    } else if (currentTab === 'admin') {
      list.push({ label: 'แผงควบคุมผู้ดูแล (Admin Console)', active: true });
    }

    return list;
  }, [currentTab, selectedCategory]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-['Prompt',sans-serif] text-slate-800">
      {/* Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab as any);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onOpenPostModal={() => {
          if (!user) {
            info('โปรดเข้าสู่ระบบ', 'กรุณาเข้าสู่ระบบก่อนทำการแบ่งปันสื่อความรู้');
            setAuthModalOpen(true);
            return;
          }
          setEditingResource(null);
          setPostModalOpen(true);
        }}
        siteSettings={siteSettings}
        favoritesCount={favorites.length}
      />

      {/* Main Container */}
      <main className="flex-1">
        {/* TAB: ADMIN DASHBOARD */}
        {currentTab === 'admin' ? (
          <AdminDashboard
            onBack={() => setCurrentTab('home')}
            siteSettings={siteSettings}
            onRefreshSettings={loadSettingsAndSeed}
          />
        ) : currentTab === 'favorites' ? (
          /* TAB: FAVORITES */
          <FavoritesView
            favorites={favoriteResources}
            onToggleFavorite={handleToggleFavorite}
            onSelectResource={setSelectedResource}
            onReport={setReportResource}
            onExplore={() => setCurrentTab('explore')}
          />
        ) : currentTab === 'my-posts' ? (
          /* TAB: MY POSTS */
          <MyResourcesView
            resources={myResources}
            favoriteIds={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
            onSelectResource={setSelectedResource}
            onEditResource={handleEditResource}
            onDeleteResource={handleDeleteResource}
            onOpenPostModal={() => {
              setEditingResource(null);
              setPostModalOpen(true);
            }}
          />
        ) : (
          /* TAB: HOME & EXPLORE */
          <div>
            {/* Hero Section on Home */}
            {currentTab === 'home' && (
              <HeroSection
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSearchSubmit={handleSearchSubmit}
                selectedCategory={selectedCategory}
                onSelectCategory={(cat) => {
                  setSelectedCategory(cat);
                  fetchResources();
                }}
                siteSettings={siteSettings}
                totalResources={resources.length}
                totalCategories={siteSettings?.categories.length || DEFAULT_CATEGORIES.length}
              />
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {/* Breadcrumb Navigation */}
              <Breadcrumb items={breadcrumbItems} />

              {/* Categories Bar */}
              <CategoriesBar
                categories={siteSettings?.categories || DEFAULT_CATEGORIES}
                selectedCategory={selectedCategory}
                onSelectCategory={(cat) => {
                  setSelectedCategory(cat);
                  fetchResources();
                }}
                categoryCounts={categoryCounts}
              />

              {/* Filter & Sorting Controls */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Search in explore mode */}
                {currentTab === 'explore' && (
                  <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-blue-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="พิมพ์คำค้นหา..."
                      className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    />
                  </form>
                )}

                {/* Grade & Media type dropdowns */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden sm:inline">กรอง:</span>
                  </div>

                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="all">ทุกระดับชั้น</option>
                    {DEFAULT_GRADE_LEVELS.filter((g) => g !== 'ทุกระดับชั้น').map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedMediaType}
                    onChange={(e) => setSelectedMediaType(e.target.value)}
                    className="text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="all">ทุกประเภทสื่อ</option>
                    <option value="pdf">PDF เอกสาร</option>
                    <option value="video">วิดีโอคลิป</option>
                    <option value="website">เว็บไซต์ / ลิงก์</option>
                    <option value="document">เอกสารสรุป</option>
                    <option value="image">รูปภาพ / อินโฟ</option>
                  </select>

                  <div className="flex items-center gap-1 text-xs text-slate-500 border-l border-slate-200 pl-2 ml-1">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="text-xs font-medium px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="newest">อัปเดตล่าสุด</option>
                      <option value="popular">รายการโปรดยอดนิยม</option>
                      <option value="views">ยอดเข้าชมสูงสุด</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setSelectedGrade('all');
                      setSelectedMediaType('all');
                      setSortBy('newest');
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                    title="ล้างตัวกรองทั้งหมด"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Resource Grid Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span>
                    {selectedCategory === 'all'
                      ? 'สื่อการเรียนรู้แนะนำทั้งหมด'
                      : `หมวดหมู่: ${selectedCategory}`}
                  </span>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    {resources.length}
                  </span>
                </h2>
              </div>

              {/* Resources List or Loading/Empty State */}
              {loadingResources ? (
                <LoadingSkeleton />
              ) : resources.length === 0 ? (
                <EmptyState
                  type="search"
                  actionLabel="ล้างตัวกรองและแสดงทั้งหมด"
                  onAction={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedGrade('all');
                    setSelectedMediaType('all');
                  }}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {resources.map((resource) => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      isFavorited={favoriteIds.has(resource.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onSelectResource={setSelectedResource}
                      onReport={setReportResource}
                      onEdit={handleEditResource}
                      onDelete={handleDeleteResource}
                      isAuthorOrAdmin={user?.uid === resource.authorId || isAdmin}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">
                {siteSettings?.siteName || 'EduShare Hub'}
              </p>
              <p className="text-[11px] text-slate-400">
                ร่วมสร้างสังคมแห่งการแบ่งปันความรู้เพื่อเยาวชนและคุณครูไทย
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-600">
            <button onClick={() => setCurrentTab('home')} className="hover:text-blue-600 transition-colors">
              หน้าแรก
            </button>
            <button onClick={() => setCurrentTab('explore')} className="hover:text-blue-600 transition-colors">
              คลังความรู้
            </button>
            {user && (
              <button onClick={() => setCurrentTab('favorites')} className="hover:text-blue-600 transition-colors">
                รายการโปรด
              </button>
            )}
            {(isAdmin || isModerator) && (
              <button onClick={() => setCurrentTab('admin')} className="text-indigo-600 font-semibold hover:underline">
                แดชบอร์ดผู้ดูแล
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 text-slate-400 text-[11px]">
            <span>พัฒนาด้วย</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
            <span>เชื่อมต่อ Cloud Firestore & Firebase Auth</span>
          </div>
        </div>
      </footer>

      {/* Resource Detail Modal */}
      <ResourceDetailModal
        resource={selectedResource}
        onClose={() => setSelectedResource(null)}
        isFavorited={selectedResource ? favoriteIds.has(selectedResource.id) : false}
        onToggleFavorite={handleToggleFavorite}
        onReport={setReportResource}
        onEdit={handleEditResource}
        onDelete={handleDeleteResource}
      />

      {/* Post Resource Modal */}
      <PostResourceModal
        isOpen={postModalOpen}
        onClose={() => {
          setPostModalOpen(false);
          setEditingResource(null);
        }}
        onSuccess={() => {
          fetchResources();
          if (user) fetchFavorites();
        }}
        siteSettings={siteSettings}
        editResource={editingResource}
      />

      {/* Report Modal */}
      <ReportModal
        resource={reportResource}
        onClose={() => setReportResource(null)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-100 animate-fadeIn">
            <h3 className="font-bold text-lg text-rose-600">ยืนยันการลบสื่อการเรียนรู้</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              คุณต้องการลบ "{deleteTarget.title}" หรือไม่? เมื่อลบแล้ว ข้อมูลจะไม่สามารถกู้คืนได้
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmDeleteResource}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all"
              >
                ลบสื่อถาวร
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
