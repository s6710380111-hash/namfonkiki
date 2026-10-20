import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  action?: () => void;
  active?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center text-xs sm:text-sm text-slate-500 py-3 overflow-x-auto whitespace-nowrap no-scrollbar">
      <button
        onClick={items[0]?.action}
        className="flex items-center gap-1.5 hover:text-blue-600 transition-colors shrink-0"
      >
        <Home className="w-3.5 h-3.5" />
        <span>หน้าแรก</span>
      </button>

      {items.slice(1).map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 mx-1.5 shrink-0" />
          {item.active || !item.action ? (
            <span className="font-semibold text-slate-800 shrink-0 truncate max-w-[200px] sm:max-w-md">
              {item.label}
            </span>
          ) : (
            <button
              onClick={item.action}
              className="hover:text-blue-600 transition-colors shrink-0 truncate max-w-[150px] sm:max-w-xs"
            >
              {item.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
