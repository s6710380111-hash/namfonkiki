import React, { useState } from 'react';
import { X, Flag, AlertCircle, Loader2 } from 'lucide-react';
import { Resource, ReportReason } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { submitReport } from '../services/db';

interface ReportModalProps {
  resource: Resource | null;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ resource, onClose }) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [reason, setReason] = useState<ReportReason>('broken_link');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!resource) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      error('กรุณาเข้าสู่ระบบก่อนรายงานเนื้อหา');
      return;
    }

    setSubmitting(true);
    try {
      await submitReport({
        resourceId: resource.id,
        resourceTitle: resource.title,
        reporterId: user.uid,
        reporterEmail: user.email || '',
        reporterName: user.displayName || user.email?.split('@')[0] || 'ผู้ใช้งาน',
        reason,
        details: details.trim()
      });
      success('ส่งรายงานเรียบร้อยแล้ว', 'ทีมงานจะตรวจสอบเนื้อหาตามนโยบายความปลอดภัย');
      onClose();
    } catch (err: any) {
      console.error(err);
      error('ไม่สามารถส่งรายงานได้', err?.message || 'โปรดลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
            <Flag className="w-4 h-4" />
            <span>รายงานเนื้อหาหรือปัญหา</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">สื่อที่กำลังรายงาน:</p>
            <p className="text-xs font-semibold text-slate-800 bg-slate-100 p-2.5 rounded-xl truncate">
              {resource.title}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              สาเหตุของการรายงาน <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-500 bg-white"
            >
              <option value="broken_link">ลิงก์เสีย / ไฟล์เปิดไม่ได้ / เว็บไซต์หาย</option>
              <option value="copyright">ละเมิดลิขสิทธิ์ / สื่อของผู้อื่นโดยไม่ได้รับอนุญาต</option>
              <option value="inappropriate">เนื้อหาไม่เหมาะสม / หยาบคาย / ขัดต่อศีลธรรม</option>
              <option value="inaccurate">เนื้อหาผิดพลาดอย่างร้ายแรง / ข้อมูลบิดเบือน</option>
              <option value="spam">สแปม / โฆษณาขายสินค้า</option>
              <option value="other">สาเหตุอื่นๆ</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              รายละเอียดเพิ่มเติม
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="ระบุข้อความหรือข้อมูลเพิ่มเติมเพื่อให้ผู้ดูแลระบบตรวจสอบได้แม่นยำ..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-500"
            ></textarea>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>กำลังส่ง...</span>
                </>
              ) : (
                <span>ส่งรายงาน</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
