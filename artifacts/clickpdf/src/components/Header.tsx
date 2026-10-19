import React from 'react';
import { Menu, ShieldCheck, Newspaper, PlusCircle, Sun, Moon, Zap, HelpCircle, Layers, Share2 } from 'lucide-react';
import { ToolCategory } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { BrandLogo } from './BrandLogo';

interface HeaderProps {
  onSelectCategory: (category: ToolCategory) => void;
  onOpenMobileMenu: () => void;
  onOpenAdmin?: () => void;
  onGoHome: () => void;
  onOpenBlog: () => void;
  onOpenFaq?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenBatchQueue?: () => void;
  onOpenShare?: () => void;
  activeView: 'home' | 'tool' | 'blog' | 'batch' | 'faq';
}

export const Header: React.FC<HeaderProps> = ({
  onSelectCategory,
  onOpenMobileMenu,
  onOpenAdmin,
  onGoHome,
  onOpenBlog,
  onOpenFaq,
  onOpenCommandPalette,
  onOpenBatchQueue,
  onOpenShare,
  activeView,
}) => {
  const { t, language } = useLanguage();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Zone 1: Brand mark with official logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onGoHome}
            className="flex items-center gap-1.5 text-left group cursor-pointer focus:outline-none"
            aria-label="ClickPDF Home"
          >
            <span className="font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight leading-none">Click</span>
            <BrandLogo className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 aspect-square group-hover:scale-105 transition-transform drop-shadow-sm" />
          </button>
        </div>

        {/* Zone 2: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => { onGoHome(); onSelectCategory('all'); }}
            className={`hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer ${activeView === 'home' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : ''}`}
          >
            {t.allPdfTools}
          </button>
          <button
            onClick={() => { onGoHome(); onSelectCategory('organize'); }}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            {t.mergeAndSplit}
          </button>
          <button
            onClick={() => { onGoHome(); onSelectCategory('optimize'); }}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            {t.compress}
          </button>
          <button
            onClick={() => { onGoHome(); onSelectCategory('convert'); }}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            {t.convert}
          </button>
          <button
            onClick={() => { onGoHome(); onSelectCategory('security'); }}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            {t.security}
          </button>
          {onOpenBatchQueue && (
            <button
              onClick={onOpenBatchQueue}
              className={`flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer ${activeView === 'batch' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : ''}`}
            >
              <Layers className="w-4 h-4 text-cyan-500" />
              <span>{t.batchQueueEngine}</span>
            </button>
          )}
          <button
            onClick={onOpenBlog}
            className={`flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer ${activeView === 'blog' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : ''}`}
            title="Open ClickPDF Blogs"
          >
            <Newspaper className="w-4 h-4 text-indigo-500" />
            <span>{t.articlesAndSeo}</span>
          </button>
        </nav>

        {/* Zone 3: Actions, Theme Switcher & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{t.inBrowserBadge}</span>
          </div>



          {/* Share Button (WhatsApp & Social) */}
          {onOpenShare && (
            <button
              onClick={onOpenShare}
              aria-label="Share ClickPDF"
              title="Share ClickPDF on WhatsApp & Social Media"
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-all cursor-pointer active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}

          {/* Language Switcher Dropdown */}
          <LanguageSwitcher variant="header" />

          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 sm:px-2.5 sm:py-2 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-all cursor-pointer flex items-center justify-center"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 transition-transform hover:-rotate-12" />
            )}
          </button>

          {/* Three-line Hamburger menu button */}
          <button
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
