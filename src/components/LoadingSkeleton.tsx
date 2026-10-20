import React from 'react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[1, 2, 3, 4, 5, 6].map((idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl border border-slate-200/70 p-5 space-y-3.5 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-20 h-6 bg-slate-200 rounded-lg"></div>
              <div className="w-16 h-6 bg-slate-100 rounded-lg"></div>
            </div>
            <div className="w-7 h-7 bg-slate-200 rounded-lg"></div>
          </div>
          <div className="w-3/4 h-5 bg-slate-200 rounded-md"></div>
          <div className="w-1/3 h-4 bg-slate-100 rounded-md"></div>
          <div className="space-y-2 pt-1">
            <div className="w-full h-3 bg-slate-100 rounded-sm"></div>
            <div className="w-5/6 h-3 bg-slate-100 rounded-sm"></div>
            <div className="w-2/3 h-3 bg-slate-100 rounded-sm"></div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
            <div className="w-24 h-4 bg-slate-100 rounded-md"></div>
            <div className="w-16 h-4 bg-slate-100 rounded-md"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
