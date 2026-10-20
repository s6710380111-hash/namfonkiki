import React, { useEffect } from 'react';
import {
  X,
  ExternalLink,
  Bookmark,
  Flag,
  Calendar,
  User,
  GraduationCap,
  Eye,
  FileText,
  Share2,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Resource } from '../types';
import { getMediaTypeBadge, formatThaiDate } from './ResourceCard';
import { useAuth } from '../context/AuthContext';
import { incrementViewCount } from '../services/db';

interface ResourceDetailModalProps {
  resource: Resource | null;
  onClose: () => void;
  isFavorited: boolean;
  onToggleFavorite: (resource: Resource) => void;
  onReport: (resource: Resource) => void;
  onEdit?: (resource: Resource) => void;
  onDelete?: (resource: Resource) => void;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  resource,
  onClose,
  isFavorited,
  onToggleFavorite,
  onReport,
  onEdit,
  onDelete
}) => {
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (resource?.id) {
      incrementViewCount(resource.id);
    }
  }, [resource?.id]);

  if (!resource) return null;

  const isAuthor = user?.uid === resource.authorId;
  const canManage = isAuthor || isAdmin;
  const mediaBadge = getMediaTypeBadge(resource.mediaType);

  // Helper for YouTube embed
  const getYouTubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  const ytEmbedUrl = resource.mediaType === 'video' ? getYouTubeEmbedUrl(resource.fileUrl) : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border ${mediaBadge.color}`}
            >
              {mediaBadge.icon}
              <span>{mediaBadge.label}</span>
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700">
              {resource.category}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(resource)}
              className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-medium ${
                isFavorited
                  ? 'bg-amber-50 text-amber-600 border border-amber-200'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-amber-500 hover:border-amber-200'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isFavorited ? 'fill-amber-500' : ''}`} />
              <span className="hidden sm:inline">
                {isFavorited ? 'บันทึกแล้ว' : 'บันทึกรายการโปรด'}
              </span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
              aria-label="ปิด"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6 flex-1">
          {/* Main Title */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              {resource.title}
            </h2>

            {/* Author and Metadata Bar */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-medium text-slate-800">{resource.authorName || 'สมาชิก'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>เผยแพร่เมื่อ {formatThaiDate(resource.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                <span>{resource.gradeLevel}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>เข้าชม {resource.viewCount || 0} ครั้ง</span>
              </div>
            </div>
          </div>

          {/* Interactive Media Preview Section */}
          <div className="rounded-2xl border border-slate-200 bg-slate-900/5 overflow-hidden">
            {ytEmbedUrl ? (
              <div className="aspect-video w-full">
                <iframe
                  src={ytEmbedUrl}
                  title={resource.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : resource.mediaType === 'image' ? (
              <div className="max-h-96 flex items-center justify-center p-2 bg-slate-950">
                <img
                  src={resource.fileUrl}
                  alt={resource.title}
                  className="max-h-92 w-auto object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="p-6 text-center bg-gradient-to-br from-blue-50/50 to-sky-50/40">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-md border border-sky-100 mx-auto flex items-center justify-center text-blue-600 mb-3">
                  {mediaBadge.icon}
                </div>
                <h4 className="font-bold text-slate-800 text-sm sm:text-base">
                  {resource.fileName || resource.title}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  สื่อประเภท {mediaBadge.label} สามารถเปิดดูหรือดาวน์โหลดได้ผ่านลิงก์อย่างเป็นทางการ
                </p>
                <div className="mt-4">
                  <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all"
                  >
                    <span>เปิดดูสื่อ / ดาวน์โหลดไฟล์</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Description Content */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-2">รายละเอียดและเนื้อหา</h4>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-100">
              {resource.description}
            </div>
          </div>

          {/* Tags */}
          {resource.tags && resource.tags.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 mb-2">ป้ายกำกับที่เกี่ยวข้อง:</h4>
              <div className="flex flex-wrap gap-2">
                {resource.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-100 text-xs font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onReport(resource)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>รายงานปัญหา</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {canManage && (
              <>
                {onEdit && (
                  <button
                    onClick={() => onEdit(resource)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                    <span>แก้ไข</span>
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(resource)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบสื่อ</span>
                  </button>
                )}
              </>
            )}

            <a
              href={resource.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs"
            >
              <span>เปิดลิงก์</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
