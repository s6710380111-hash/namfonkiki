import React from 'react';
import { BookOpen, SearchX, PlusCircle, BookmarkX } from 'lucide-react';

interface EmptyStateProps {
  type?: 'search' | 'favorites' | 'posts' | 'general';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'general',
  title,
  description,
  actionLabel,
  onAction
}) => {
  const getIcon = () => {
    switch (type) {
      case 'search':
        return <SearchX className="w-12 h-12 text-blue-400" />;
      case 'favorites':
        return <BookmarkX className="w-12 h-12 text-amber-400" />;
      case 'posts':
        return <BookOpen className="w-12 h-12 text-sky-400" />;
      default:
        return <BookOpen className="w-12 h-12 text-blue-400" />;
    }
  };

  const defaultTitle =
    title ||
    (type === 'search'
      ? 'ไม่พบข้อมูลที่ตรงกับการค้นหา'
      : type === 'favorites'
      ? 'ยังไม่มีรายการโปรดที่บันทึกไว้'
      : type === 'posts'
      ? 'คุณยังไม่ได้แบ่งปันสื่อการเรียนรู้'
      : 'ยังไม่มีสื่อการเรียนรู้ในขณะนี้');

  const defaultDescription =
    description ||
    (type === 'search'
      ? 'ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่นดูนะ'
      : type === 'favorites'
      ? 'กดไอคอนบุ๊กมาร์กที่การ์ดสื่อการสอนที่คุณสนใจ เพื่อเก็บไว้อ่านทบทวนภายหลัง'
      : type === 'posts'
      ? 'ร่วมสร้างสังคมแห่งการเรียนรู้ แบ่งปันสรุปบทเรียนและเอกสารของคุณได้เลย'
      : 'เป็นคนแรกที่เริ่มแบ่งปันความรู้ให้กับเพื่อนๆ และคุณครู');

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-14 text-center max-w-lg mx-auto shadow-xs">
      <div className="w-20 h-20 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-center mx-auto mb-4">
        {getIcon()}
      </div>
      <h3 className="font-extrabold text-slate-800 text-lg sm:text-xl mb-2">
        {defaultTitle}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">
        {defaultDescription}
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{actionLabel || 'แบ่งปันความรู้ใหม่'}</span>
        </button>
      )}
    </div>
  );
};
