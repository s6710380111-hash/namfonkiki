import React from 'react';
import { FileText, PlusCircle } from 'lucide-react';
import { Resource } from '../types';
import { ResourceCard } from './ResourceCard';
import { EmptyState } from './EmptyState';

interface MyResourcesViewProps {
  resources: Resource[];
  favoriteIds: Set<string>;
  onToggleFavorite: (resource: Resource) => void;
  onSelectResource: (resource: Resource) => void;
  onEditResource: (resource: Resource) => void;
  onDeleteResource: (resource: Resource) => void;
  onOpenPostModal: () => void;
}

export const MyResourcesView: React.FC<MyResourcesViewProps> = ({
  resources,
  favoriteIds,
  onToggleFavorite,
  onSelectResource,
  onEditResource,
  onDeleteResource,
  onOpenPostModal
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <span>สื่อความรู้ที่ฉันแชร์</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            จัดการ แก้ไข หรือลบสื่อการเรียนการสอนที่คุณแบ่งปันให้กับสังคม
          </p>
        </div>

        <button
          onClick={onOpenPostModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all w-fit"
        >
          <PlusCircle className="w-4 h-4" />
          <span>โพสต์สื่อใหม่</span>
        </button>
      </div>

      {resources.length === 0 ? (
        <EmptyState
          type="posts"
          title="คุณยังไม่ได้แบ่งปันสื่อการสอน"
          description="กดปุ่มด้านล่างเพื่อเริ่มแบ่งปันเอกสาร สไลด์สรุปบทเรียน หรือวิดีโอแรกของคุณ"
          actionLabel="เริ่มแบ่งปันความรู้"
          onAction={onOpenPostModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              isFavorited={favoriteIds.has(resource.id)}
              onToggleFavorite={onToggleFavorite}
              onSelectResource={onSelectResource}
              onReport={() => {}}
              onEdit={onEditResource}
              onDelete={onDeleteResource}
              isAuthorOrAdmin={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};
