import React from 'react';
import {
  FileText,
  Video,
  Globe,
  FileCode,
  Image as ImageIcon,
  Bookmark,
  Eye,
  ExternalLink,
  GraduationCap,
  Calendar,
  User,
  MoreVertical,
  Flag,
  Trash2,
  Edit3
} from 'lucide-react';
import { Resource, MediaType } from '../types';

interface ResourceCardProps {
  resource: Resource;
  isFavorited: boolean;
  onToggleFavorite: (resource: Resource) => void;
  onSelectResource: (resource: Resource) => void;
  onReport: (resource: Resource) => void;
  onEdit?: (resource: Resource) => void;
  onDelete?: (resource: Resource) => void;
  isAuthorOrAdmin?: boolean;
}

export const getMediaTypeBadge = (type: MediaType) => {
  switch (type) {
    case 'pdf':
      return {
        label: 'PDF เอกสาร',
        icon: <FileText className="w-3.5 h-3.5" />,
        color: 'bg-rose-50 text-rose-700 border-rose-200'
      };
    case 'video':
      return {
        label: 'วิดีโอคลิป',
        icon: <Video className="w-3.5 h-3.5" />,
        color: 'bg-indigo-50 text-indigo-700 border-indigo-200'
      };
    case 'website':
      return {
        label: 'เว็บไซต์ / ลิงก์',
        icon: <Globe className="w-3.5 h-3.5" />,
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    case 'image':
      return {
        label: 'รูปภาพ / อินโฟ',
        icon: <ImageIcon className="w-3.5 h-3.5" />,
        color: 'bg-amber-50 text-amber-700 border-amber-200'
      };
    default:
      return {
        label: 'เอกสารการเรียน',
        icon: <FileCode className="w-3.5 h-3.5" />,
        color: 'bg-sky-50 text-sky-700 border-sky-200'
      };
  }
};

export const formatThaiDate = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const thaiYear = date.getFullYear() + 543;
  return `${day} ${month} ${thaiYear}`;
};

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  isFavorited,
  onToggleFavorite,
  onSelectResource,
  onReport,
  onEdit,
  onDelete,
  isAuthorOrAdmin
}) => {
  const mediaBadge = getMediaTypeBadge(resource.mediaType);

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 hover:border-blue-400/80 shadow-xs hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Top Media & Category Badges */}
      <div className="p-4 sm:p-5 pb-3">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.8 rounded-lg text-xs font-semibold border ${mediaBadge.color}`}
            >
              {mediaBadge.icon}
              <span>{mediaBadge.label}</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
              <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
              <span>{resource.gradeLevel || 'ทุกระดับชั้น'}</span>
            </span>
          </div>

          {/* Favorite Toggle Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(resource);
            }}
            title={isFavorited ? 'ยกเลิกบันทึกรายการโปรด' : 'บันทึกลงรายการโปรด'}
            className={`p-2 rounded-xl transition-all ${
              isFavorited
                ? 'bg-amber-50 text-amber-500 hover:bg-amber-100 scale-105 shadow-xs'
                : 'text-slate-400 hover:text-amber-500 hover:bg-slate-50'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isFavorited ? 'fill-amber-500' : ''}`} />
          </button>
        </div>

        {/* Title */}
        <h3
          onClick={() => onSelectResource(resource)}
          className="text-base sm:text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-2 cursor-pointer leading-snug mb-2"
        >
          {resource.title}
        </h3>

        {/* Category tag */}
        <div className="mb-2.5">
          <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
            {resource.category}
          </span>
          {resource.status === 'hidden' && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 ml-1.5">
              ซ่อนอยู่
            </span>
          )}
        </div>

        {/* Description snippet */}
        <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed mb-4">
          {resource.description}
        </p>
      </div>

      {/* Footer Info */}
      <div className="mt-auto px-4 sm:px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        {/* Author info */}
        <div className="flex items-center gap-1.5 min-w-0 pr-2">
          <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px] shrink-0">
            {resource.authorName ? resource.authorName[0].toUpperCase() : 'U'}
          </div>
          <span className="truncate max-w-[100px] sm:max-w-[130px] font-medium text-slate-700">
            {resource.authorName || 'สมาชิก'}
          </span>
        </div>

        {/* View / Fav stats */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1" title="จำนวนครั้งที่เข้าชม">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>{resource.viewCount || 0}</span>
          </div>
          <div className="flex items-center gap-1" title="จำนวนที่บันทึกเป็นรายการโปรด">
            <Bookmark className="w-3.5 h-3.5 text-slate-400" />
            <span>{resource.favoriteCount || 0}</span>
          </div>
        </div>
      </div>

      {/* Card Action Bar */}
      <div className="px-4 py-2.5 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          onClick={() => onSelectResource(resource)}
          className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium text-blue-700 bg-blue-50/70 hover:bg-blue-100 text-center transition-colors flex items-center justify-center gap-1"
        >
          <span>ดูรายละเอียด</span>
        </button>

        <a
          href={resource.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
          title="เปิดไฟล์หรือลิงก์ตรง"
        >
          <ExternalLink className="w-4 h-4" />
        </a>

        {/* Reporting option */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReport(resource);
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          title="รายงานเนื้อหาไม่เหมาะสม หรือลิงก์เสีย"
        >
          <Flag className="w-3.5 h-3.5" />
        </button>

        {/* Author / Admin quick actions */}
        {isAuthorOrAdmin && (
          <div className="flex items-center gap-1 border-l border-slate-200 pl-1.5">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(resource);
                }}
                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title="แก้ไขข้อมูล"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(resource);
                }}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="ลบสื่อนี้"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
