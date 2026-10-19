import React from 'react';
import { X, ShieldCheck, PlusCircle, ArrowRight, Zap, HelpCircle } from 'lucide-react';
import { PDF_TOOLS } from '../data/toolsData';
import { PDFTool, ToolCategory } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { LegalModalTab } from './LegalModal';
import { BrandLogo } from './BrandLogo';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (tool: PDFTool) => void;
  onSelectCategory: (category: ToolCategory) => void;
  onOpenAdmin?: () => void;
  onOpenBlog: () => void;
  onOpenSitemap?: () => void;
  onOpenFaq?: () => void;
  onOpenBatchQueue?: () => void;
  onOpenLegal?: (tab: LegalModalTab) => void;
  onOpenShare?: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  onSelectTool,
  onSelectCategory,
  onOpenAdmin,
  onOpenBlog,
  onOpenSitemap,
  onOpenFaq,
  onOpenBatchQueue,
  onOpenLegal,
  onOpenShare,
}) => {
  const { t, getToolTitle, getToolDescription } = useLanguage();

  if (!isOpen) return null;

  const categories = [
    { key: 'organize', label: t.catOrganize },
    { key: 'optimize', label: t.catOptimize },
    { key: 'convert', label: t.catConvert },
    { key: 'edit', label: t.catEdit },
    { key: 'security', label: t.catSecurity },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 transition-colors">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/90">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight leading-none">Click</span>
              <BrandLogo className="h-8 w-8 shrink-0 aspect-square drop-shadow-xs" />
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content / Tool Catalog */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {categories.map((cat) => {
              const toolsInCat = PDF_TOOLS.filter(t => t.category === cat.key);
              if (toolsInCat.length === 0) return null;

              return (
                <div key={cat.key}>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {cat.label}
                    </span>
                    <button
                      onClick={() => {
                        onClose();
                        onSelectCategory(cat.key as ToolCategory);
                      }}
                      className="text-[11px] text-indigo-600 hover:underline"
                    >
                      View all ({toolsInCat.length})
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {toolsInCat.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => {
                          onClose();
                          onSelectTool(tool);
                        }}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-between group border border-transparent hover:border-slate-200 cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                              {getToolTitle(tool)}
                            </span>
                            {tool.badge && (
                              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700">
                                {tool.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {getToolDescription(tool)}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer note & Legal Links */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-3">
            <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{t.feature1Title}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.feature1Desc}
                </p>
              </div>
            </div>

            {onOpenLegal && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 flex-wrap gap-y-1 gap-x-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenLegal('about');
                  }}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 font-medium"
                >
                  About Us
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenLegal('contact');
                  }}
                  className="text-indigo-600 dark:text-indigo-400 font-semibold"
                >
                  Contact
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenLegal('cookies');
                  }}
                  className="text-amber-500 hover:text-amber-400 font-medium"
                >
                  Cookies Policy
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenLegal('privacy');
                  }}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 font-medium"
                >
                  Privacy
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenLegal('terms');
                  }}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 font-medium"
                >
                  Terms
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
