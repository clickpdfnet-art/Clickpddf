import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  Zap,
  ArrowRight,
  BookOpen,
  HelpCircle,
  FolderTree,
  Shield,
  Layers,
  Sparkles,
  Command,
  Sun,
  Moon,
  CornerDownLeft,
  FileText,
  Download,
  Info,
  Cookie
} from 'lucide-react';
import { PDFTool, BlogPost, ToolCategory } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ToolIcon } from './ToolIcon';
import { LegalModalTab } from './LegalModal';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tools: PDFTool[];
  articles: BlogPost[];
  onSelectTool: (tool: PDFTool) => void;
  onSelectArticle: (article: BlogPost) => void;
  onGoHome: () => void;
  onOpenBlog: () => void;
  onOpenFaq: () => void;
  onOpenSitemap: () => void;
  onOpenBatchQueue?: () => void;
  onSelectCategory?: (category: ToolCategory) => void;
  onOpenLegal?: (tab: LegalModalTab) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  tools,
  articles,
  onSelectTool,
  onSelectArticle,
  onGoHome,
  onOpenBlog,
  onOpenFaq,
  onOpenSitemap,
  onOpenBatchQueue,
  onSelectCategory,
  onOpenLegal
}) => {
  const { getToolTitle, getToolDescription } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input automatically when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen]);

  // Combined searchable items
  interface PaletteItem {
    id: string;
    type: 'tool' | 'navigation' | 'article' | 'action';
    title: string;
    subtitle?: string;
    badge?: string;
    icon: React.ReactNode;
    action: () => void;
  }

  const items = useMemo<PaletteItem[]>(() => {
    const list: PaletteItem[] = [];

    // Quick Navigation & Actions
    if (onOpenBatchQueue) {
      list.push({
        id: 'nav-batch',
        type: 'navigation',
        title: 'Batch Processing Queue',
        subtitle: 'Process multiple PDF files sequentially with progress indicators',
        badge: 'Batch',
        icon: <Layers className="w-4 h-4 text-cyan-500" />,
        action: () => {
          onOpenBatchQueue();
          onClose();
        }
      });
    }

    list.push({
      id: 'nav-home',
      type: 'navigation',
      title: 'Home / All PDF Tools Grid',
      subtitle: 'Return to main dashboard and view all 10 browser tools',
      badge: 'Esc / H',
      icon: <Zap className="w-4 h-4 text-amber-500" />,
      action: () => {
        onGoHome();
        onClose();
      }
    });

    list.push({
      id: 'nav-blog',
      type: 'navigation',
      title: 'Articles & PDF Guides',
      subtitle: 'Browse all in-depth tutorials, privacy architecture, and tips',
      badge: 'Articles',
      icon: <BookOpen className="w-4 h-4 text-indigo-500" />,
      action: () => {
        onOpenBlog();
        onClose();
      }
    });

    list.push({
      id: 'nav-faq',
      type: 'navigation',
      title: 'Frequently Asked Questions (FAQ)',
      subtitle: 'Security proofs, client-side RAM isolation, and offline support',
      badge: 'Trust & FAQ',
      icon: <HelpCircle className="w-4 h-4 text-emerald-500" />,
      action: () => {
        onOpenFaq();
        onClose();
      }
    });

    if (onOpenLegal) {
      list.push({
        id: 'nav-about',
        type: 'navigation',
        title: 'About Us — ClickPDF Vision & Architecture',
        subtitle: 'Learn about our 100% in-browser mission, zero-server privacy, and open standards',
        badge: 'About',
        icon: <Info className="w-4 h-4 text-indigo-500" />,
        action: () => {
          onOpenLegal('about');
          onClose();
        }
      });

      list.push({
        id: 'nav-contact',
        type: 'navigation',
        title: 'Contact Us & Developer Support',
        subtitle: 'Direct contact channel, bug reports, and advertising inquiries',
        badge: 'Support',
        icon: <BookOpen className="w-4 h-4 text-indigo-500" />,
        action: () => {
          onOpenLegal('contact');
          onClose();
        }
      });

      list.push({
        id: 'nav-cookies',
        type: 'navigation',
        title: 'Cookies Policy',
        subtitle: 'Cookie disclosures, local storage usage, and third-party partner controls',
        icon: <Cookie className="w-4 h-4 text-amber-500" />,
        action: () => {
          onOpenLegal('cookies');
          onClose();
        }
      });

      list.push({
        id: 'nav-privacy',
        type: 'navigation',
        title: 'Privacy Policy & Zero-Storage Architecture',
        subtitle: 'Review client-side isolation, GDPR compliance, and RAM purge guarantees',
        badge: 'Legal / Trust',
        icon: <Shield className="w-4 h-4 text-emerald-500" />,
        action: () => {
          onOpenLegal('privacy');
          onClose();
        }
      });

      list.push({
        id: 'nav-terms',
        type: 'navigation',
        title: 'Terms of Service & Usage Agreement',
        subtitle: 'Permitted use, ISO 32000 standard adherence, and open-source licenses',
        badge: 'Legal',
        icon: <FileText className="w-4 h-4 text-cyan-500" />,
        action: () => {
          onOpenLegal('terms');
          onClose();
        }
      });
    }

    list.push({
      id: 'action-theme',
      type: 'action',
      title: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      subtitle: `Toggle UI visual theme (currently ${isDark ? 'Dark' : 'Light'})`,
      badge: 'Theme',
      icon: isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />,
      action: () => {
        toggleTheme();
        onClose();
      }
    });

    // Category jumps
    if (onSelectCategory) {
      list.push({
        id: 'cat-organize',
        type: 'navigation',
        title: 'Filter: Organize Tools',
        subtitle: 'Merge, Split, Rotate & Page Numbering',
        badge: 'Category',
        icon: <Layers className="w-4 h-4 text-blue-500" />,
        action: () => {
          onGoHome();
          onSelectCategory('organize');
          onClose();
        }
      });
      list.push({
        id: 'cat-optimize',
        type: 'navigation',
        title: 'Filter: Optimize & Compress',
        subtitle: 'Client-side PDF compression & clean-up',
        badge: 'Category',
        icon: <Sparkles className="w-4 h-4 text-teal-500" />,
        action: () => {
          onGoHome();
          onSelectCategory('optimize');
          onClose();
        }
      });
      list.push({
        id: 'cat-security',
        type: 'navigation',
        title: 'Filter: Security & Privacy',
        subtitle: 'Watermark, Protect & Local Encryption',
        badge: 'Category',
        icon: <Shield className="w-4 h-4 text-emerald-500" />,
        action: () => {
          onGoHome();
          onSelectCategory('security');
          onClose();
        }
      });
    }

    // Tools
    tools.forEach((tool) => {
      const title = getToolTitle(tool);
      const desc = getToolDescription(tool);
      list.push({
        id: `tool-${tool.id}`,
        type: 'tool',
        title,
        subtitle: desc,
        badge: tool.category.toUpperCase(),
        icon: <ToolIcon name={tool.iconName} className="w-4 h-4 text-indigo-500" />,
        action: () => {
          onSelectTool(tool);
          onClose();
        }
      });
    });

    // Articles
    articles.forEach((art) => {
      list.push({
        id: `art-${art.id}`,
        type: 'article',
        title: art.title,
        subtitle: art.excerpt,
        badge: art.category,
        icon: <FileText className="w-4 h-4 text-indigo-400" />,
        action: () => {
          onSelectArticle(art);
          onClose();
        }
      });
    });

    return list;
  }, [
    tools,
    articles,
    getToolTitle,
    getToolDescription,
    onGoHome,
    onOpenBlog,
    onOpenFaq,
    onOpenSitemap,
    onSelectTool,
    onSelectArticle,
    onSelectCategory,
    onClose,
    isDark,
    toggleTheme
  ]);

  // Filter items by search query
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        (item.badge && item.badge.toLowerCase().includes(q))
      );
    });
  }, [items, query]);

  // Reset selected index on filter change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation within the command palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
      scrollActiveIntoView((selectedIndex + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev - 1 < 0 ? Math.max(0, filteredItems.length - 1) : prev - 1
      );
      scrollActiveIntoView(
        selectedIndex - 1 < 0 ? Math.max(0, filteredItems.length - 1) : selectedIndex - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const scrollActiveIntoView = (index: number) => {
    if (!listRef.current) return;
    const element = listRef.current.children[index] as HTMLElement;
    if (element) {
      element.scrollIntoView({ block: 'nearest' });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette and Search"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl shadow-slate-950/30 overflow-hidden flex flex-col max-h-[80vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Search className="w-5 h-5 text-indigo-500 shrink-0 ml-1 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a tool name, article, or action... (e.g. merge, compress, faq)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base sm:text-lg focus:outline-none focus:ring-0"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded-md">
              <span>ESC to close</span>
            </div>
          )}
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2 max-h-[60vh]"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium">No tools or actions found for &quot;{query}&quot;</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Try searching for &quot;merge&quot;, &quot;split&quot;, &quot;compress&quot;, or &quot;faq&quot;
              </p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-slate-900 dark:text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                      isSelected
                        ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    {item.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{item.title}</span>
                      {item.badge && (
                        <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.subtitle && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center text-xs text-slate-400 shrink-0">
                    {isSelected ? (
                      <div className="flex items-center gap-1 font-mono text-[11px] text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md shadow-2xs border border-indigo-200 dark:border-indigo-800/60">
                        <span>Select</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </div>
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-2xs">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-2xs">
                ↓
              </kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-2xs">
                ↵
              </kbd>
              to select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-2xs">
                ESC
              </kbd>
              to close
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
            <Command className="w-3 h-3" />
            <span>Power User Palette</span>
          </div>
        </div>
      </div>
    </div>
  );
};
