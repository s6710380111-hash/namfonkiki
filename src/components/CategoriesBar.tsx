import React from 'react';
import {
  Layers,
  Cpu,
  Atom,
  Binary,
  Languages,
  BookMarked,
  Globe,
  Palette,
  Briefcase,
  GraduationCap,
  Sparkles
} from 'lucide-react';

interface CategoriesBarProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  categoryCounts?: Record<string, number>;
}

export const getCategoryIcon = (catName: string) => {
  if (catName.includes('คอมพิวเตอร์') || catName.includes('เทคโนโลยี')) return <Cpu className="w-4 h-4" />;
  if (catName.includes('วิทยาศาสตร์') || catName.includes('ชีววิทยา') || catName.includes('ฟิสิกส์')) return <Atom className="w-4 h-4" />;
  if (catName.includes('คณิตศาสตร์')) return <Binary className="w-4 h-4" />;
  if (catName.includes('ภาษาต่างประเทศ') || catName.includes('ภาษาอังกฤษ')) return <Languages className="w-4 h-4" />;
  if (catName.includes('ภาษาไทย')) return <BookMarked className="w-4 h-4" />;
  if (catName.includes('สังคม') || catName.includes('ประวัติศาสตร์')) return <Globe className="w-4 h-4" />;
  if (catName.includes('ศิลปะ') || catName.includes('ดนตรี')) return <Palette className="w-4 h-4" />;
  if (catName.includes('การเงิน') || catName.includes('บริหาร')) return <Briefcase className="w-4 h-4" />;
  if (catName.includes('สอบ') || catName.includes('การศึกษาต่อ')) return <GraduationCap className="w-4 h-4" />;
  return <Sparkles className="w-4 h-4" />;
};

export const CategoriesBar: React.FC<CategoriesBarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  categoryCounts = {}
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <span>หมวดหมู่วิชาและความรู้</span>
        </h2>
        {selectedCategory !== 'all' && (
          <button
            onClick={() => onSelectCategory('all')}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
          >
            แสดงทั้งหมด
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
        <button
          onClick={() => onSelectCategory('all')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium shrink-0 transition-all ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-semibold'
              : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/30'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>ทั้งหมด</span>
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          const count = categoryCounts[cat];
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium shrink-0 transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-semibold'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/30'
              }`}
            >
              <span className={isSelected ? 'text-white' : 'text-blue-600'}>
                {getCategoryIcon(cat)}
              </span>
              <span>{cat}</span>
              {typeof count === 'number' && count > 0 && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
