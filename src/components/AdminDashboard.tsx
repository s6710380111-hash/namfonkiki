import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Users,
  Settings as SettingsIcon,
  FileText,
  Trash2,
  EyeOff,
  Eye,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  RefreshCw,
  ExternalLink,
  Loader2,
  History,
  Info
} from 'lucide-react';
import {
  ContentReport,
  UserProfile,
  Resource,
  SiteSettings,
  ModerationLog,
  UserRole,
  UserStatus
} from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  getAllReports,
  updateReportStatus,
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  getResources,
  updateResource,
  deleteResource,
  getSiteSettings,
  updateSiteSettings,
  logModerationAction,
  getModerationLogs
} from '../services/db';
import { formatThaiDate } from './ResourceCard';

interface AdminDashboardProps {
  onBack: () => void;
  siteSettings: SiteSettings | null;
  onRefreshSettings: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBack,
  siteSettings,
  onRefreshSettings
}) => {
  const { user, profile, isAdmin } = useAuth();
  const { success, error, warning, info } = useToast();

  const [activeTab, setActiveTab] = useState<'reports' | 'users' | 'resources' | 'settings' | 'logs'>('reports');
  const [loading, setLoading] = useState(false);

  // Data states
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [resourcesList, setResourcesList] = useState<Resource[]>([]);
  const [logsList, setLogsList] = useState<ModerationLog[]>([]);

  // Filtering states
  const [userSearch, setUserSearch] = useState('');
  const [resourceSearch, setResourceSearch] = useState('');
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('pending');

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
    confirmLabel?: string;
    danger?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: async () => {},
    confirmLabel: 'ยืนยัน',
    danger: false
  });

  // Settings form states
  const [settingsForm, setSettingsForm] = useState<SiteSettings>({
    siteName: '',
    siteDescription: '',
    announcement: '',
    announcementActive: true,
    categories: [],
    allowRegistration: true,
    updatedBy: '',
    updatedAt: ''
  });
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Load initial data for the active tab
  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'reports') {
        const reps = await getAllReports();
        setReports(reps);
      } else if (activeTab === 'users') {
        const uList = await getAllUsers();
        setUsersList(uList);
      } else if (activeTab === 'resources') {
        const res = await getResources();
        setResourcesList(res);
      } else if (activeTab === 'settings') {
        const s = await getSiteSettings();
        setSettingsForm(s);
      } else if (activeTab === 'logs') {
        const logs = await getModerationLogs();
        setLogsList(logs);
      }
    } catch (err: any) {
      console.error(err);
      error('ไม่สามารถโหลดข้อมูลได้', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Report Actions
  const handleResolveReport = async (report: ContentReport, actionType: 'resolve_and_hide' | 'resolve_and_delete' | 'dismiss') => {
    if (!user) return;

    if (actionType === 'resolve_and_delete') {
      setConfirmModal({
        isOpen: true,
        title: 'ยืนยันการลบสื่อถาวร',
        message: `คุณต้องการลบสื่อ "${report.resourceTitle}" ออกจากระบบถาวรตามรายงานใช่หรือไม่? ข้อมูลจะไม่สามารถกู้คืนได้`,
        danger: true,
        confirmLabel: 'ลบสื่อถาวร',
        action: async () => {
          await deleteResource(report.resourceId);
          await updateReportStatus(report.id, 'resolved', user.uid, 'ลบสื่อตามรายงาน');
          await logModerationAction({
            action: 'delete_resource',
            targetId: report.resourceId,
            targetType: 'resource',
            moderatorId: user.uid,
            moderatorEmail: user.email || '',
            reason: `ลบสื่อตามรายงาน #${report.id} (${report.reason})`
          });
          success('ลบสื่อและบันทึกผลการรายงานเรียบร้อยแล้ว');
          loadData();
        }
      });
    } else if (actionType === 'resolve_and_hide') {
      await updateResource(report.resourceId, { status: 'hidden' });
      await updateReportStatus(report.id, 'resolved', user.uid, 'ซ่อนสื่อชั่วคราวเพื่อตรวจสอบ');
      await logModerationAction({
        action: 'hide_resource',
        targetId: report.resourceId,
        targetType: 'resource',
        moderatorId: user.uid,
        moderatorEmail: user.email || '',
        reason: `ซ่อนสื่อตามรายงาน #${report.id}`
      });
      success('ซ่อนสื่อและดำเนินการตรวจสอบเรียบร้อย');
      loadData();
    } else {
      await updateReportStatus(report.id, 'dismissed', user.uid, 'ไม่พบความผิดปกติ / ยกเลิกรายงาน');
      await logModerationAction({
        action: 'resolve_report',
        targetId: report.id,
        targetType: 'report',
        moderatorId: user.uid,
        moderatorEmail: user.email || '',
        reason: 'ยกเลิกรายงาน ไม่พบความผิดปกติ'
      });
      info('ยกเลิกรายงานเรียบร้อยแล้ว');
      loadData();
    }
  };

  // User Management Actions
  const handleToggleUserStatus = (targetUser: UserProfile) => {
    if (!user) return;
    const isCurrentlyActive = targetUser.status === 'active';
    const newStatus: UserStatus = isCurrentlyActive ? 'suspended' : 'active';

    setConfirmModal({
      isOpen: true,
      title: isCurrentlyActive ? 'ยืนยันการระงับบัญชี' : 'ยืนยันการปลดระงับบัญชี',
      message: isCurrentlyActive
        ? `คุณต้องการระงับการใช้งานของ "${targetUser.displayName}" (${targetUser.email}) หรือไม่? ผู้ใช้จะไม่สามารถเข้าสู่ระบบหรือโพสต์สื่อได้`
        : `คุณต้องการเปิดใช้งานบัญชี "${targetUser.displayName}" หรือไม่?`,
      danger: isCurrentlyActive,
      confirmLabel: isCurrentlyActive ? 'ระงับบัญชี' : 'เปิดใช้งาน',
      action: async () => {
        await updateUserStatus(targetUser.uid, newStatus);
        await logModerationAction({
          action: isCurrentlyActive ? 'suspend_user' : 'activate_user',
          targetId: targetUser.uid,
          targetType: 'user',
          moderatorId: user.uid,
          moderatorEmail: user.email || '',
          reason: isCurrentlyActive ? 'ระงับเนื่องจากทำผิดกฎการใช้งาน' : 'ปลดการระงับบัญชี'
        });
        success(isCurrentlyActive ? 'ระงับบัญชีสำเร็จ' : 'เปิดใช้งานบัญชีเรียบร้อย');
        loadData();
      }
    });
  };

  const handleChangeUserRole = async (targetUser: UserProfile, newRole: UserRole) => {
    if (!user) return;
    try {
      await updateUserRole(targetUser.uid, newRole);
      await logModerationAction({
        action: 'change_role',
        targetId: targetUser.uid,
        targetType: 'user',
        moderatorId: user.uid,
        moderatorEmail: user.email || '',
        reason: `เปลี่ยนบทบาทเป็น ${newRole}`
      });
      success(`ปรับเปลี่ยนบทบาทของ ${targetUser.displayName} เป็น ${newRole} สำเร็จ`);
      loadData();
    } catch (err: any) {
      error('ไม่สามารถเปลี่ยนบทบาทได้', err?.message);
    }
  };

  // Resource Management Actions
  const handleToggleResourceStatus = async (res: Resource) => {
    if (!user) return;
    const newStatus = res.status === 'published' ? 'hidden' : 'published';
    try {
      await updateResource(res.id, { status: newStatus });
      await logModerationAction({
        action: newStatus === 'hidden' ? 'hide_resource' : 'unhide_resource',
        targetId: res.id,
        targetType: 'resource',
        moderatorId: user.uid,
        moderatorEmail: user.email || '',
        reason: newStatus === 'hidden' ? 'ผู้ดูแลซ่อนสื่อจากสาธารณะ' : 'เปิดให้แสดงผลสาธารณะ'
      });
      success(newStatus === 'hidden' ? 'ซ่อนสื่อเรียบร้อยแล้ว' : 'เผยแพร่สื่อสู่สาธารณะแล้ว');
      loadData();
    } catch (err: any) {
      error('ไม่สามารถอัปเดตสถานะสื่อได้', err?.message);
    }
  };

  const handleDeleteResource = (res: Resource) => {
    if (!user) return;
    setConfirmModal({
      isOpen: true,
      title: 'ยืนยันการลบสื่อการสอน',
      message: `คุณต้องการลบ "${res.title}" ถาวรใช่หรือไม่?`,
      danger: true,
      confirmLabel: 'ลบถาวร',
      action: async () => {
        await deleteResource(res.id);
        await logModerationAction({
          action: 'delete_resource',
          targetId: res.id,
          targetType: 'resource',
          moderatorId: user.uid,
          moderatorEmail: user.email || '',
          reason: 'ผู้ดูแลลบสื่อออกจากระบบ'
        });
        success('ลบสื่อเรียบร้อยแล้ว');
        loadData();
      }
    });
  };

  // Settings Actions
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) {
      error('เฉพาะแอดมินสูงสุดเท่านั้นที่สามารถแก้ไขการตั้งค่าเว็บไซต์');
      return;
    }

    setSavingSettings(true);
    try {
      await updateSiteSettings(settingsForm, user.uid);
      await logModerationAction({
        action: 'update_settings',
        targetId: 'siteConfig',
        targetType: 'setting',
        moderatorId: user.uid,
        moderatorEmail: user.email || '',
        reason: 'อัปเดตการตั้งค่าเว็บไซต์และหมวดหมู่'
      });
      success('บันทึกการตั้งค่าเว็บไซต์สำเร็จ');
      onRefreshSettings();
    } catch (err: any) {
      error('ไม่สามารถบันทึกการตั้งค่าได้', err?.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddCategory = () => {
    const val = newCategoryInput.trim();
    if (!val) return;
    if (settingsForm.categories.includes(val)) {
      warning('มีหมวดหมู่นี้อยู่แล้วในระบบ');
      return;
    }
    setSettingsForm({
      ...settingsForm,
      categories: [...settingsForm.categories, val]
    });
    setNewCategoryInput('');
  };

  const handleRemoveCategory = (catToRemove: string) => {
    setSettingsForm({
      ...settingsForm,
      categories: settingsForm.categories.filter((c) => c !== catToRemove)
    });
  };

  // Filtered lists
  const filteredUsers = usersList.filter(
    (u) =>
      u.displayName?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredResources = resourcesList.filter(
    (r) =>
      r.title?.toLowerCase().includes(resourceSearch.toLowerCase()) ||
      r.category?.toLowerCase().includes(resourceSearch.toLowerCase()) ||
      r.authorName?.toLowerCase().includes(resourceSearch.toLowerCase())
  );

  const filteredReports = reports.filter((r) => {
    if (reportFilter === 'all') return true;
    return r.status === reportFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              ระบบผู้ดูแลเว็บไซต์ (Admin & Moderator Console)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ตรวจสอบรายงานเนื้อหา, บริหารจัดการสมาชิก, และกำหนดการตั้งค่าเว็บไซต์แบบไดนามิก
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            กลับสู่หน้าหลัก
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto py-4 border-b border-slate-100 mb-6">
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'reports'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>รายงานเนื้อหา ({reports.filter((r) => r.status === 'pending').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>จัดการสมาชิก</span>
        </button>

        <button
          onClick={() => setActiveTab('resources')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'resources'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>จัดการสื่อความรู้ทั้งหมด</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>ตั้งค่าเว็บไซต์ & หมวดหมู่</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'logs'
              ? 'bg-slate-800 text-white shadow-md shadow-slate-800/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <History className="w-4 h-4" />
          <span>ประวัติการดำเนินงาน</span>
        </button>
      </div>

      {/* Loading state indicator */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-sm font-medium text-slate-500">กำลังโหลดข้อมูล...</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 1: REPORTS QUEUE */}
      {/* ============================================================== */}
      {!loading && activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <span>คิวตรวจสอบรายงานจากผู้ใช้</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-extrabold">
                {reports.length} รายการ
              </span>
            </h3>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium">กรองสถานะ:</span>
              {(['pending', 'resolved', 'dismissed', 'all'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setReportFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    reportFilter === st
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'pending'
                    ? 'รอตรวจสอบ'
                    : st === 'resolved'
                    ? 'ดำเนินการแล้ว'
                    : st === 'dismissed'
                    ? 'ยกเลิก'
                    : 'ทั้งหมด'}
                </button>
              ))}
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="font-bold text-slate-700 text-base">ไม่มีรายการรายงานที่ค้างอยู่</p>
              <p className="text-xs text-slate-400 mt-1">
                สื่อทั้งหมดในระบบผ่านเกณฑ์และพร้อมให้บริการ
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-md font-semibold ${
                          report.status === 'pending'
                            ? 'bg-rose-100 text-rose-700'
                            : report.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {report.status === 'pending'
                          ? 'รอตรวจสอบ'
                          : report.status === 'resolved'
                          ? 'แก้ไขแล้ว'
                          : 'ยกเลิก'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatThaiDate(report.createdAt)}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        เหตุผล: {report.reason}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-base leading-snug">
                      {report.resourceTitle}
                    </h4>

                    {report.details && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        "{report.details}"
                      </p>
                    )}

                    <p className="text-[11px] text-slate-400">
                      ผู้แจ้ง: {report.reporterEmail || report.reporterId}
                    </p>
                  </div>

                  {report.status === 'pending' && (
                    <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <button
                        onClick={() => handleResolveReport(report, 'resolve_and_hide')}
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors flex items-center gap-1.5"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>ซ่อนสื่อ</span>
                      </button>

                      <button
                        onClick={() => handleResolveReport(report, 'resolve_and_delete')}
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ลบสื่อทิ้ง</span>
                      </button>

                      <button
                        onClick={() => handleResolveReport(report, 'dismiss')}
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>ยกเลิกรายงาน</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: USERS MANAGEMENT */}
      {/* ============================================================== */}
      {!loading && activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="ค้นหาชื่อ หรืออีเมลสมาชิก..."
                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              สมาชิกรวม {usersList.length} คน
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">ผู้ใช้งาน</th>
                    <th className="px-5 py-3.5">อีเมล</th>
                    <th className="px-5 py-3.5">บทบาท (Role)</th>
                    <th className="px-5 py-3.5">สถานะ</th>
                    <th className="px-5 py-3.5 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.uid} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {u.displayName ? u.displayName[0].toUpperCase() : 'U'}
                          </div>
                          <span className="truncate max-w-[150px]">{u.displayName}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-slate-600">{u.email}</td>

                      <td className="px-5 py-3.5">
                        {isAdmin ? (
                          <select
                            value={u.role}
                            onChange={(e) => handleChangeUserRole(u, e.target.value as UserRole)}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                          >
                            <option value="member">สมาชิกทั่วไป (Member)</option>
                            <option value="moderator">ผู้ตรวจสอบ (Moderator)</option>
                            <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                          </select>
                        ) : (
                          <span className="font-semibold text-slate-700 capitalize">
                            {u.role}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {u.status === 'active' ? 'ปกติ (Active)' : 'ถูกระงับ (Suspended)'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            u.status === 'active'
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {u.status === 'active' ? 'ระงับบัญชี' : 'ปลดการระงับ'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: ALL RESOURCES MANAGEMENT */}
      {/* ============================================================== */}
      {!loading && activeTab === 'resources' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
                placeholder="ค้นหาชื่อสื่อ, หมวดหมู่ หรือผู้แต่ง..."
                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              สื่อการสอนทั้งหมด {resourcesList.length} รายการ
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredResources.map((res) => (
              <div
                key={res.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      {res.category}
                    </span>
                    <span className="text-xs text-slate-400">
                      {res.gradeLevel}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        res.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {res.status === 'published' ? 'เผยแพร่' : 'ซ่อนอยู่'}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                    {res.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    ผู้แต่ง: {res.authorName} ({res.authorEmail}) • เข้าชม: {res.viewCount || 0}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={res.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                    title="เปิดดูสื่อ"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => handleToggleResourceStatus(res)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 ${
                      res.status === 'published'
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {res.status === 'published' ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>ซ่อน</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>เปิดเผยแพร่</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteResource(res)}
                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
                    title="ลบสื่อทิ้ง"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: SITE SETTINGS & CATEGORIES */}
      {/* ============================================================== */}
      {!loading && activeTab === 'settings' && isAdmin && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-indigo-600" />
              <span>การตั้งค่าข้อมูลเว็บไซต์</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ชื่อเว็บไซต์
                </label>
                <input
                  type="text"
                  value={settingsForm.siteName}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, siteName: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  อีเมลติดต่อผู้ดูแล
                </label>
                <input
                  type="email"
                  value={settingsForm.contactEmail || ''}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, contactEmail: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                คำอธิบายเว็บไซต์ (Subtitle / Description)
              </label>
              <textarea
                rows={2}
                value={settingsForm.siteDescription}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, siteDescription: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              ></textarea>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  ข้อความประกาศด้านบน (Announcement Banner)
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.announcementActive}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        announcementActive: e.target.checked
                      })
                    }
                    className="rounded text-indigo-600"
                  />
                  <span>เปิดแสดงแถบประกาศ</span>
                </label>
              </div>
              <input
                type="text"
                value={settingsForm.announcement}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, announcement: e.target.value })
                }
                placeholder="เช่น ยินดีต้อนรับสู่เทอมใหม่! ร่วมแชร์สรุปข้อสอบเพื่อรับตราผู้แบ่งปันยอดเยี่ยม"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          {/* Dynamic Categories Manager */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                จัดการหมวดหมู่วิชาความรู้ (เพิ่ม / ลบ ได้ทันที)
              </h3>
              <p className="text-xs text-slate-500">
                หมวดหมู่นี้จะแสดงในหน้าหลัก ตัวกรอง และฟอร์มการโพสต์สื่อโดยอัตโนมัติ
              </p>
            </div>

            {/* Add Category Form */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
                placeholder="พิมพ์ชื่อหมวดหมู่ใหม่ เช่น ดาราศาสตร์, ปรัชญา, AI..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มหมวดหมู่</span>
              </button>
            </div>

            {/* List of current categories */}
            <div className="flex flex-wrap gap-2 pt-2">
              {settingsForm.categories.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs sm:text-sm font-medium border border-slate-200"
                >
                  <span>{cat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(cat)}
                    className="text-slate-400 hover:text-rose-600 transition-colors ml-1 p-0.5 rounded"
                    title={`ลบหมวดหมู่ ${cat}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {savingSettings ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังบันทึกการตั้งค่า...</span>
                </>
              ) : (
                <span>บันทึกการตั้งค่าเว็บไซต์ทั้งหมด</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* TAB 5: AUDIT LOGS */}
      {/* ============================================================== */}
      {!loading && activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <History className="w-4 h-4 text-slate-600" />
              <span>บันทึกประวัติการตรวจสอบและการกระทำของผู้ดูแล</span>
            </h3>
            <span className="text-xs text-slate-500">{logsList.length} รายการ</span>
          </div>

          {logsList.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-200">
              ยังไม่มีประวัติการดำเนินการของผู้ดูแล
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
              {logsList.map((log) => (
                <div key={log.id} className="p-4 flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 px-2 py-0.5 rounded bg-slate-100">
                        {log.action}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {log.targetType}:{log.targetId}
                      </span>
                    </div>
                    <p className="text-slate-700 font-medium">เหตุผล: {log.reason}</p>
                    <p className="text-slate-400">โดย: {log.moderatorEmail}</p>
                  </div>
                  <span className="text-slate-400 shrink-0">
                    {formatThaiDate(log.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-100 animate-fadeIn">
            <h3
              className={`font-bold text-lg ${
                confirmModal.danger ? 'text-rose-600' : 'text-slate-800'
              }`}
            >
              {confirmModal.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={async () => {
                  await confirmModal.action();
                  setConfirmModal({ ...confirmModal, isOpen: false });
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-sm transition-all ${
                  confirmModal.danger
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmModal.confirmLabel || 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
