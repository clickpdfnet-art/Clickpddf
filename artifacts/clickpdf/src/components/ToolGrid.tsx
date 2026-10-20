import React from 'react';
import { PDFTool, ToolCategory } from '../types';
import { CATEGORIES } from '../data/toolsData';
import { ToolIcon } from './ToolIcon';
import { Search, Zap, Layers, ShieldCheck, Lock, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ToolGridProps {
  tools: PDFTool[];
  selectedCategory: ToolCategory;
  onSelectCategory: (category: ToolCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectTool: (tool: PDFTool) => void;
  onOpenBatchQueue?: () => void;
}

export const ToolGrid: React.FC<ToolGridProps> = ({
  tools,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onSelectTool,
  onOpenBatchQueue,
}) => {
  const { t, getToolTitle, getToolDescription } = useLanguage();

  const getCategoryLabel = (id: ToolCategory) => {
    switch (id) {
      case 'all': return t.catAll;
      case 'organize': return t.catOrganize;
      case 'optimize': return t.catOptimize;
      case 'convert': return t.catConvert;
      case 'edit': return t.catEdit;
      case 'security': return t.catSecurity;
      default: return id;
    }
  };

  return (
    <div className="w-full">
      {/* 1. Top Hero Banner - Slim & Elegant (Motto & Sub-badge ONLY, Search Removed) */}
      <section className="relative overflow-hidden mx-3 sm:mx-6 lg:mx-auto max-w-6xl mt-2 sm:mt-3 mb-2.5 py-3 sm:py-3.5 px-4 sm:px-6 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-indigo-800/40 shadow-lg text-white text-center">
        {/* Ambient background glows */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-purple-600/15 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-indigo-600/20 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-1.5">
          {/* Prominent Main Brand Headline */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-sm">
            Stay Secure, Stay Smart
          </h1>

          {/* Sub-Motto Badge */}
          <div className="flex items-center justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] sm:text-xs font-bold shadow-xs backdrop-blur-sm">
              <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Your Data, Your Privacy - 100% Private</span>
            </span>
          </div>
        </div>
      </section>

      {/* 2. Multi-File Processing Info Banner (Moved right below Hero, button removed) */}
      <div className="mx-3 sm:mx-6 lg:mx-auto max-w-6xl mb-2.5 bg-gradient-to-r from-indigo-900/90 via-slate-900/90 to-indigo-950/90 rounded-xl p-3 text-white border border-indigo-800/50 shadow-xs relative overflow-hidden flex flex-col items-center justify-center text-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-cyan-300 shrink-0">
          <Layers className="w-4 h-4" />
        </div>
        <div>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">Need to process multiple PDF files at once?</h3>
            <span className="text-[9px] font-bold uppercase tracking-wider bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 px-1.5 py-0.2 rounded-full">New</span>
          </div>
          <p className="text-[11px] text-indigo-200/80 leading-tight">
            Launch any tool below to select or drop multiple PDF files and process them sequentially with 100% private local execution.
          </p>
        </div>
      </div>

      {/* 3. Sleek Standalone Search Bar Box */}
      <div className="mx-auto w-[calc(100%-1.5rem)] sm:w-[calc(100%-3rem)] max-w-xl mb-3 px-1">
        <div className="relative group">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors z-10 pointer-events-none" />
          <input
            id="global-search-input"
            type="text"
            placeholder={t.searchPlaceholder || 'Search all PDF tools...'}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-14 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-500 text-slate-900 dark:text-white rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
              /
            </kbd>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* 4. Category Filter Buttons */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-4">
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`px-3 py-1 text-xs sm:text-sm font-medium rounded-full transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {getCategoryLabel(cat.id)}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Grid of Tools */}
      <section className="max-w-7xl mx-auto px-2.5 sm:px-6 pb-12">

        {tools.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {t.noToolsFound} &quot;{searchQuery}&quot;
            </p>
            <button
              onClick={() => { onSearchChange(''); onSelectCategory('all'); }}
              className="mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              {t.resetFilter}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 md:gap-4">
            {tools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => onSelectTool(tool)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectTool(tool);
                  }
                }}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl p-3 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5 cursor-pointer flex flex-col items-center text-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-500/40 min-h-[140px] sm:min-h-[150px]"
              >
                {/* 1. Tool Name on Top */}
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors tracking-tight line-clamp-1 leading-snug w-full">
                  {getToolTitle(tool)}
                </h3>

                {/* 2. Tool Picture / Icon - Compact & Small (w-9 h-9) */}
                <div className="my-1.5 sm:my-2">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-50 via-slate-50 to-indigo-100/70 dark:from-indigo-950/70 dark:via-slate-800/80 dark:to-slate-800 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:bg-indigo-600 dark:group-hover:text-white transition-all duration-200 shadow-2xs group-hover:scale-105 group-hover:shadow-sm">
                    <ToolIcon name={tool.iconName} className="w-4.5 h-4.5 sm:w-5 sm:h-5 transition-transform group-hover:scale-110" />
                  </div>
                </div>

                {/* 3. Brief Description Below - Clamped to 2 lines max */}
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-tight line-clamp-2 w-full">
                  {getToolDescription(tool)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
