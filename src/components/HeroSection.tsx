import React from 'react';
import { Search, Sparkles, BookOpen, Users, FileCheck2, ArrowRight } from 'lucide-react';
import { SiteSettings } from '../types';

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  siteSettings: SiteSettings | null;
  totalResources: number;
  totalCategories: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  selectedCategory,
  onSelectCategory,
  siteSettings,
  totalResources,
  totalCategories
}) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-blue-800 to-sky-900 text-white pt-10 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 rounded-b-3xl sm:rounded-b-[2.5rem] shadow-xl shadow-blue-900/10 mb-8">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-400/20 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-10 w-80 h-80 bg-blue-500/25 rounded-full blur-2xl pointer-events-none"></div>

      <div className="relative max-w-5xl mx-auto text-center">
        {/* Site Announcement banner if active */}
        {siteSettings?.announcementActive && siteSettings?.announcement && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm text-sky-100 mb-6 hover:bg-white/15 transition-colors">
            <Sparkles className="w-4 h-4 text-sky-300 animate-pulse shrink-0" />
            <span className="truncate max-w-xs sm:max-w-xl">{siteSettings.announcement}</span>
          </div>
        )}

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight sm:leading-tight mb-4">
          แหล่งรวบรวมและแบ่งปันความรู้ <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-sky-200 via-white to-blue-200 bg-clip-text text-transparent">
            เพื่อนักเรียน นักศึกษา และคุณครู
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-sky-100/90 font-normal mb-8 leading-relaxed">
          {siteSettings?.siteDescription ||
            'ค้นหาเอกสารสรุปบทเรียน ข้อสอบเก่า สื่อมัลติมีเดีย และองค์ความรู้คุณภาพจากเครือข่ายผู้เรียนรู้ทั่วประเทศ'}
        </p>

        {/* Large Search Input Box */}
        <form onSubmit={onSearchSubmit} className="max-w-3xl mx-auto relative mb-6">
          <div className="flex flex-col sm:flex-row items-stretch gap-2 bg-white p-2 rounded-2xl shadow-2xl shadow-blue-950/30 border border-white/30 backdrop-blur-sm">
            <div className="flex items-center flex-1 px-3 py-1.5 text-slate-800">
              <Search className="w-5 h-5 text-blue-500 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="ค้นหาชื่อเรื่อง, วิชา, บทเรียน, เนื้อหา หรือชื่อผู้แต่ง..."
                className="w-full bg-transparent border-none text-slate-800 placeholder-slate-400 text-sm sm:text-base focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => onSelectCategory(e.target.value)}
                className="bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium rounded-xl px-3 py-2.5 border border-slate-200 focus:outline-none hover:bg-slate-100 transition-colors"
              >
                <option value="all">ทุกหมวดหมู่</option>
                {siteSettings?.categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-blue-600/30 transition-all flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>ค้นหา</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>

        {/* Quick Tag Recommendations */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-sky-200">
          <span className="font-medium text-sky-100">ค้นหายอดนิยม:</span>
          {['Python', 'แคลคูลัส', 'IELTS', 'ชีววิทยา', 'ข้อสอบ TCAS', 'ฟิสิกส์'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                onSearchChange(tag);
              }}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-sky-100 border border-white/10 transition-all"
            >
              #{tag}
            </button>
          ))}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto mt-10 pt-8 border-t border-white/10">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-sky-300 font-extrabold text-xl sm:text-2xl">
              <BookOpen className="w-5 h-5 text-sky-400" />
              <span>{totalResources > 0 ? totalResources : 10}+</span>
            </div>
            <span className="text-xs text-sky-200 font-medium mt-0.5">คลังสื่อความรู้</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-sky-300 font-extrabold text-xl sm:text-2xl">
              <FileCheck2 className="w-5 h-5 text-sky-400" />
              <span>{totalCategories > 0 ? totalCategories : 10}</span>
            </div>
            <span className="text-xs text-sky-200 font-medium mt-0.5">หมวดหมู่วิชา</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-sky-300 font-extrabold text-xl sm:text-2xl">
              <Users className="w-5 h-5 text-sky-400" />
              <span>ฟรี 100%</span>
            </div>
            <span className="text-xs text-sky-200 font-medium mt-0.5">สำหรับทุกคน</span>
          </div>
        </div>

      </div>
    </section>
  );
};
