import React from 'react';
import { Bookmark, Sparkles } from 'lucide-react';
import { Resource } from '../types';
import { ResourceCard } from './ResourceCard';
import { EmptyState } from './EmptyState';

interface FavoritesViewProps {
  favorites: Resource[];
  onToggleFavorite: (resource: Resource) => void;
  onSelectResource: (resource: Resource) => void;
  onReport: (resource: Resource) => void;
  onExplore: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  favorites,
  onToggleFavorite,
  onSelectResource,
  onReport,
  onExplore
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-amber-500 fill-amber-500" />
            <span>รายการโปรดของฉัน</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            คลังบทเรียนและสื่อการสอนที่คุณบันทึกไว้สำหรับอ่านและทบทวนภายหลัง ซิงค์ตรงกับบัญชีของคุณ
          </p>
        </div>

        <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 w-fit">
          บันทึกไว้ {favorites.length} รายการ
        </span>
      </div>

      {favorites.length === 0 ? (
        <EmptyState
          type="favorites"
          title="ยังไม่มีรายการโปรด"
          description="คุณยังไม่ได้กดบันทึกสื่อความรู้ใดๆ คลิกสำรวจคลังความรู้เพื่อค้นหาสื่อที่คุณสนใจ"
          actionLabel="สำรวจคลังความรู้"
          onAction={onExplore}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {favorites.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              isFavorited={true}
              onToggleFavorite={onToggleFavorite}
              onSelectResource={onSelectResource}
              onReport={onReport}
            />
          ))}
        </div>
      )}
    </div>
  );
};
