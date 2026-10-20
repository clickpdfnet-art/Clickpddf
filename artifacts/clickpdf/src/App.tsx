import React, { useState, useEffect } from 'react';
import { PDFTool, ToolCategory, BlogPost, SeoMetaConfig } from './types';
import { PDF_TOOLS } from './data/toolsData';
import { getStoredArticles, saveArticles } from './data/initialArticles';
import { getActiveBlogArticles } from './utils/blogLoader';
import { getStoredSeoConfig, saveSeoConfig, applySeoConfigToDom, applyToolSeo, applyBlogSeo, resetHomeSeo } from './utils/seoManager';
import { getToolSeoInfo } from './data/toolSeoData';
import { parseCurrentRoute, navigateToToolUrl, navigateToHomeUrl, navigateToBlogUrl, navigateToBlogListUrl, buildAppPath } from './utils/routeParser';

import { Header } from './components/Header';
import { MobileDrawer } from './components/MobileDrawer';
import { ToolGrid } from './components/ToolGrid';
import { ToolWorkspace } from './components/ToolWorkspace';
import { BlogSection } from './components/BlogSection';
import { FeaturesSection } from './components/FeaturesSection';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { AdminModal } from './components/AdminModal';
import { SitemapModal } from './components/SitemapModal';
import { CommandPalette } from './components/CommandPalette';
import { KeyboardShortcutsHint } from './components/KeyboardShortcutsHint';
import { GlobalDropOverlay } from './components/GlobalDropOverlay';
import { FileActionModal } from './components/FileActionModal';
import { BatchQueueView } from './components/BatchQueueView';
import { LegalModal, LegalModalTab } from './components/LegalModal';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { ShareModal } from './components/ShareModal';
import { FloatingShareButton } from './components/FloatingShareButton';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';

function AppContent() {
  const [activeView, setActiveView] = useState<'home' | 'tool' | 'blog' | 'batch' | 'faq'>('home');
  const [selectedTool, setSelectedTool] = useState<PDFTool | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeArticleSlug, setActiveArticleSlug] = useState<string | null>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isSitemapModalOpen, setIsSitemapModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalModalTab>('privacy');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Global drag-and-drop & file staging states
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const [pendingDroppedFiles, setPendingDroppedFiles] = useState<File[]>([]);
  const [isFileActionModalOpen, setIsFileActionModalOpen] = useState(false);
  const [dropToast, setDropToast] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

  // Auto-dismiss drop notifications
  useEffect(() => {
    if (dropToast) {
      const timer = setTimeout(() => {
        setDropToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [dropToast]);

  // Global anti-crash and unhandled rejection guards
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.warn('ClickPDF zero-crash guard handled unhandled rejection:', event.reason);
      event.preventDefault();
    };

    const handleGlobalError = (event: ErrorEvent) => {
      console.warn('ClickPDF zero-crash guard handled runtime error:', event.message);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  // Persistent articles state
  const [articles, setArticles] = useState<BlogPost[]>([]);
  // Persistent SEO & Social Meta state
  const [seoConfig, setSeoConfig] = useState<SeoMetaConfig>(getStoredSeoConfig());

  // Universal client-side router syncing URL changes (pathname /tools/:slug, hash, query params)
  const syncFromUrl = () => {
    try {
      const route = parseCurrentRoute();

      if (route.view === 'tool' && route.toolId) {
        const found = PDF_TOOLS.find((t) => t.id === route.toolId);
        if (found) {
          setSelectedTool(found);
          setActiveView('tool');
          const seo = getToolSeoInfo(found.id);
          if (seo) {
            applyToolSeo(seo);
          }
          return;
        }
      }

      if (route.view === 'blog') {
        setSelectedTool(null);
        setActiveView('blog');
        setActiveArticleSlug(route.articleSlug || null);
        if (route.articleSlug) {
          const allPosts = getActiveBlogArticles();
          const match = allPosts.find((a) => a.slug === route.articleSlug);
          if (match) {
            applyBlogSeo(match);
            return;
          }
        }
        resetHomeSeo(seoConfig);
        document.title = 'ClickPDF Knowledge Base & Privacy Blog';
        return;
      }

      if (route.view === 'batch') {
        setSelectedTool(null);
        setActiveArticleSlug(null);
        setActiveView('batch');
        resetHomeSeo(seoConfig);
        return;
      }

      if (route.view === 'faq') {
        setSelectedTool(null);
        setActiveArticleSlug(null);
        setActiveView('faq');
        resetHomeSeo(seoConfig);
        return;
      }

      if (route.isSitemapModalOpen) {
        setIsSitemapModalOpen(true);
      }
      if (route.isAdminModalOpen) {
        setIsAdminModalOpen(true);
      }

      // Default Home View
      setSelectedTool(null);
      setActiveArticleSlug(null);
      setActiveView('home');
      resetHomeSeo(seoConfig);
    } catch {
      // Ignore URL parsing errors
    }
  };

  useEffect(() => {
    setArticles(getStoredArticles());
    const initialSeo = getStoredSeoConfig();
    setSeoConfig(initialSeo);
    applySeoConfigToDom(initialSeo);
    syncFromUrl();

    const handleRouteChange = () => {
      syncFromUrl();
    };

    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('hashchange', handleRouteChange);
    };
  }, []);

  // Global Keyboard Shortcuts (Ctrl+K, Cmd+K, '/', 'Esc', 'h')
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        (activeElement as HTMLElement)?.isContentEditable;

      // 1. Ctrl+K or Cmd+K: Open/Toggle Command Palette
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Secret Admin Hotkey: Ctrl+Shift+A or Cmd+Shift+A
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        setIsAdminModalOpen(true);
        return;
      }

      // 2. Escape: Hierarchical dismiss
      // - First closes command palette if open
      // - Else closes open modals (Admin, Sitemap, Mobile drawer)
      // - Else if in tool view or article view, returns to home dashboard
      if (e.key === 'Escape') {
        if (isFileActionModalOpen) {
          e.preventDefault();
          setIsFileActionModalOpen(false);
          setPendingDroppedFiles([]);
          return;
        }
        if (isCommandPaletteOpen) {
          e.preventDefault();
          setIsCommandPaletteOpen(false);
          return;
        }
        if (isAdminModalOpen) {
          e.preventDefault();
          setIsAdminModalOpen(false);
          return;
        }
        if (isSitemapModalOpen) {
          e.preventDefault();
          setIsSitemapModalOpen(false);
          return;
        }
        if (isMobileMenuOpen) {
          e.preventDefault();
          setIsMobileMenuOpen(false);
          return;
        }
        if (activeArticleSlug) {
          e.preventDefault();
          handleCloseArticle();
          return;
        }
        if (selectedTool || activeView !== 'home') {
          e.preventDefault();
          handleBackToHome();
          return;
        }
      }

      // Do not trigger single-key shortcuts when the user is actively typing in an input
      if (isInputFocused) {
        return;
      }

      // 3. '/' key: Focus search bar or open command palette if not on home
      if (e.key === '/') {
        e.preventDefault();
        if (activeView === 'home' && !selectedTool) {
          const searchInput = document.getElementById('global-search-input') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
            return;
          }
        }
        // If on another page or input not available, launch the palette
        setIsCommandPaletteOpen(true);
        return;
      }

      // 4. 'h' or 'H' key: Return to Home
      if (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (activeView !== 'home' || selectedTool !== null || activeArticleSlug !== null) {
          e.preventDefault();
          handleBackToHome();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    isCommandPaletteOpen,
    isAdminModalOpen,
    isSitemapModalOpen,
    isMobileMenuOpen,
    activeArticleSlug,
    selectedTool,
    activeView
  ]);

  const handleUpdateArticles = (updated: BlogPost[]) => {
    setArticles(updated);
    saveArticles(updated);
  };

  const handleUpdateSeoConfig = (updated: SeoMetaConfig) => {
    setSeoConfig(updated);
    saveSeoConfig(updated);
  };

  const handleSelectTool = (tool: PDFTool) => {
    setSelectedTool(tool);
    setActiveView('tool');
    const toolSeo = getToolSeoInfo(tool.id);
    if (toolSeo) {
      applyToolSeo(toolSeo);
    }
    navigateToToolUrl(tool.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectToolById = (toolId: string) => {
    const found = PDF_TOOLS.find((t) => t.id === toolId);
    if (found) {
      handleSelectTool(found);
    }
  };

  const handleBackToHome = () => {
    setSelectedTool(null);
    setActiveView('home');
    setActiveArticleSlug(null);
    resetHomeSeo(seoConfig);
    navigateToHomeUrl();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToBlog = () => {
    setSelectedTool(null);
    setActiveArticleSlug(null);
    setActiveView('blog');
    resetHomeSeo(seoConfig);
    document.title = 'ClickPDF Knowledge Base & Privacy Blog';
    navigateToBlogListUrl();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToBatchQueue = (initialBatchFiles?: File[]) => {
    setSelectedTool(null);
    setActiveArticleSlug(null);
    if (initialBatchFiles && initialBatchFiles.length > 0) {
      setDroppedFiles(initialBatchFiles);
    }
    setActiveView('batch');
    try {
      window.history.pushState({}, '', buildAppPath('/batch'));
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToFaq = () => {
    setSelectedTool(null);
    setActiveArticleSlug(null);
    setActiveView('faq');
    try {
      window.history.pushState({}, '', buildAppPath('/faq'));
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectArticle = (article: BlogPost) => {
    setActiveArticleSlug(article.slug);
    applyBlogSeo(article);
    navigateToBlogUrl(article.slug);
  };

  const handleCloseArticle = () => {
    setActiveArticleSlug(null);
    resetHomeSeo(seoConfig);
    if (activeView === 'blog') {
      navigateToBlogListUrl();
    } else {
      navigateToHomeUrl();
    }
  };

  // Global Drag-and-Drop file processing & routing
  const handleGlobalFilesDropped = (files: File[], targetToolId?: string) => {
    if (!files || files.length === 0) return;

    // Validate supported file extensions and mime types
    const isSupported = (f: File) => {
      const name = f.name.toLowerCase();
      const type = f.type.toLowerCase();
      return (
        name.endsWith('.pdf') ||
        type === 'application/pdf' ||
        type.startsWith('image/') ||
        name.endsWith('.jpg') ||
        name.endsWith('.jpeg') ||
        name.endsWith('.png') ||
        name.endsWith('.webp')
      );
    };

    // In a selected tool, let that tool validate its own supported source types
    // (including Office files). Never route a later drop back to the home page.
    const validFiles = activeView === 'tool' && selectedTool ? files : files.filter(isSupported);
    if (validFiles.length === 0) {
      setDropToast({
        message: 'Only PDF documents and image files (.jpg, .png, .webp) are supported.',
        type: 'warning'
      });
      return;
    }

    // 1. Explicit tool drop target selected from overlay quick targets
    if (targetToolId) {
      const targetTool = PDF_TOOLS.find((t) => t.id === targetToolId);
      if (targetTool) {
        handleSelectTool(targetTool);
        setDroppedFiles(validFiles);
        setDropToast({
          message: `Loaded ${validFiles.length} file(s) into ${targetTool.title}`,
          type: 'success'
        });
        return;
      }
    }

    // 2. User is already working inside a tool workspace: import directly
    if (activeView === 'tool' && selectedTool) {
      setDroppedFiles(validFiles);
      setDropToast({
        message: `Loaded ${validFiles.length} file(s) into ${selectedTool.title}`,
        type: 'success'
      });
      return;
    }

    // 2b. User is in batch queue view: add to batch queue
    if (activeView === 'batch') {
      setDroppedFiles(validFiles);
      setDropToast({
        message: `Added ${validFiles.length} file(s) to Batch Queue`,
        type: 'success'
      });
      return;
    }

    // 3. User dropped images: automatically route to Image to PDF
    const allImages = validFiles.every(
      (f) =>
        f.type.startsWith('image/') ||
        ['.jpg', '.jpeg', '.png', '.webp'].some((ext) => f.name.toLowerCase().endsWith(ext))
    );

    if (allImages) {
      const imgTool = PDF_TOOLS.find((t) => t.id === 'jpg-to-pdf');
      if (imgTool) {
        handleSelectTool(imgTool);
        setDroppedFiles(validFiles);
        setDropToast({
          message: `Loaded ${validFiles.length} image(s) into Image to PDF`,
          type: 'success'
        });
      }
      return;
    }

    // 4. Multiple or single PDFs dropped on general homepage/blog: trigger smart action chooser
    setPendingDroppedFiles(validFiles);
    setIsFileActionModalOpen(true);
  };

  const handleSelectToolForDroppedFiles = (tool: PDFTool, files: File[]) => {
    setIsFileActionModalOpen(false);
    setPendingDroppedFiles([]);
    handleSelectTool(tool);
    setDroppedFiles(files);
    setDropToast({
      message: `Loaded ${files.length} file(s) into ${tool.title}`,
      type: 'success'
    });
  };

  // Filter tools based on category & search query
  const filteredTools = PDF_TOOLS.filter((tool) => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesSearch =
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* 1. Main Navigation Bar (sticky at top) */}
      <Header
        activeView={activeView}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setSelectedTool(null);
          setActiveView('home');
        }}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onGoHome={handleBackToHome}
        onOpenBlog={handleGoToBlog}
        onOpenFaq={handleScrollToFaq}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenBatchQueue={() => handleGoToBatchQueue()}
        onOpenShare={() => setIsShareModalOpen(true)}
      />

      {/* Main Viewport Content */}
      <main className="flex-1">
        {activeView === 'tool' && selectedTool ? (
          <ErrorBoundary fallbackTitle="PDF Workspace Protected" onReset={handleBackToHome}>
            <ToolWorkspace
              key={selectedTool.id}
              tool={selectedTool}
              onBack={handleBackToHome}
              initialFiles={droppedFiles}
              onFilesConsumed={() => setDroppedFiles([])}
              onOpenBatchQueue={(files) => handleGoToBatchQueue(files)}
              onOpenShare={() => setIsShareModalOpen(true)}
              onSelectTool={handleSelectTool}
            />
          </ErrorBoundary>
        ) : activeView === 'batch' ? (
          <BatchQueueView
            initialFiles={droppedFiles}
            onBackToHome={handleBackToHome}
            onClearInitialFiles={() => setDroppedFiles([])}
          />
        ) : activeView === 'faq' ? (
          <div className="py-6 min-h-[75vh]">
            <FaqSection
              onScrollToTools={handleBackToHome}
              onBackToHome={handleBackToHome}
              isStandaloneView={true}
            />
          </div>
        ) : activeView === 'blog' ? (
          <div className="py-6 min-h-[75vh]">
            <BlogSection
              articles={articles}
              onOpenAdmin={() => setIsAdminModalOpen(true)}
              activeArticleSlug={activeArticleSlug}
              onSelectArticle={handleSelectArticle}
              onCloseArticle={handleCloseArticle}
              onBackToHome={handleBackToHome}
              onSelectTool={handleSelectToolById}
            />
          </div>
        ) : (
          <>
            <ToolGrid
              tools={filteredTools}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectTool={handleSelectTool}
              onOpenBatchQueue={() => handleGoToBatchQueue()}
            />

            <FeaturesSection />
          </>
        )}
      </main>



      {/* 4. Comprehensive Footer */}
      <Footer
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          handleBackToHome();
        }}
        onOpenBlog={handleGoToBlog}
        onOpenFaq={handleScrollToFaq}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onOpenSitemap={() => setIsSitemapModalOpen(true)}
        onOpenBatchQueue={() => handleGoToBatchQueue()}
        onOpenShare={() => setIsShareModalOpen(true)}
        onOpenLegal={(tab) => {
          setLegalModalTab(tab);
          setIsLegalModalOpen(true);
        }}
      />

      {/* 5. Mobile & Desktop Side Drawer (Hamburger Menu) */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onSelectTool={handleSelectTool}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          handleBackToHome();
        }}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onOpenBlog={handleGoToBlog}
        onOpenFaq={handleScrollToFaq}
        onOpenSitemap={() => setIsSitemapModalOpen(true)}
        onOpenShare={() => setIsShareModalOpen(true)}
        onOpenBatchQueue={() => {
          setIsMobileMenuOpen(false);
          handleGoToBatchQueue();
        }}
        onOpenLegal={(tab) => {
          setIsMobileMenuOpen(false);
          setLegalModalTab(tab);
          setIsLegalModalOpen(true);
        }}
      />

      {/* 6. Admin Modal for daily articles & banner ad customization & XML sitemap & SEO Meta */}
      <ErrorBoundary fallbackTitle="Admin Panel" onReset={() => setIsAdminModalOpen(false)}>
        <AdminModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          articles={articles}
          onSaveArticles={handleUpdateArticles}
          seoConfig={seoConfig}
          onSaveSeoConfig={handleUpdateSeoConfig}
          onOpenSitemapModal={() => setIsSitemapModalOpen(true)}
        />
      </ErrorBoundary>

      {/* 7. Dynamic XML Sitemap Explorer & SEO Modal */}
      <SitemapModal
        isOpen={isSitemapModalOpen}
        onClose={() => setIsSitemapModalOpen(false)}
        tools={PDF_TOOLS}
        articles={articles}
        onSelectTool={handleSelectTool}
        onSelectArticle={handleSelectArticle}
      />

      {/* 8. Global Power User Command Palette (Ctrl+K, Cmd+K, '/') */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tools={PDF_TOOLS}
        articles={articles}
        onSelectTool={handleSelectTool}
        onSelectArticle={handleSelectArticle}
        onGoHome={handleBackToHome}
        onOpenBlog={handleGoToBlog}
        onOpenFaq={handleScrollToFaq}
        onOpenSitemap={() => setIsSitemapModalOpen(true)}
        onOpenBatchQueue={() => {
          setIsCommandPaletteOpen(false);
          handleGoToBatchQueue();
        }}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          handleBackToHome();
        }}
        onOpenLegal={(tab) => {
          setLegalModalTab(tab);
          setIsLegalModalOpen(true);
        }}
      />

      {/* 8.5 Legal & Compliance Modals (About Us, Contact Us, Cookies Policy, Privacy Policy, Terms of Service) */}
      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalModalTab}
      />

      {/* 8.6 Google AdSense & Privacy Compliant Cookie Consent Banner */}
      <CookieConsentBanner
        onOpenCookiesPolicy={() => {
          setLegalModalTab('cookies');
          setIsLegalModalOpen(true);
        }}
      />

      {/* 9. Floating Keyboard Shortcuts Helper Indicator */}
      <KeyboardShortcutsHint
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onFocusSearch={() => {
          if (activeView !== 'home' || selectedTool !== null) {
            handleBackToHome();
          }
          setTimeout(() => {
            const input = document.getElementById('global-search-input') as HTMLInputElement;
            if (input) {
              input.focus();
              input.select();
            }
          }, 80);
        }}
      />

      {/* 9.5 Floating Action Share Button */}
      <FloatingShareButton onOpenShare={() => setIsShareModalOpen(true)} />

      {/* 9.6 Comprehensive Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      {/* 10. Global Drag-and-Drop Overlay */}
      <GlobalDropOverlay
        currentTool={activeView === 'tool' ? selectedTool : null}
        tools={PDF_TOOLS}
        onFilesDropped={handleGlobalFilesDropped}
      />

      {/* 11. Smart File Action Modal for dropped single or multiple PDFs */}
      <FileActionModal
        isOpen={isFileActionModalOpen}
        files={pendingDroppedFiles}
        tools={PDF_TOOLS}
        onSelectTool={handleSelectToolForDroppedFiles}
        onOpenBatchQueue={(files) => {
          setIsFileActionModalOpen(false);
          setPendingDroppedFiles([]);
          handleGoToBatchQueue(files);
        }}
        onClose={() => {
          setIsFileActionModalOpen(false);
          setPendingDroppedFiles([]);
        }}
      />

      {/* 12. Floating Toast Notification for File Load State */}
      {dropToast && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-950/20 text-sm animate-in fade-in slide-in-from-top-4 duration-200 max-w-md w-auto"
        >
          {dropToast.type === 'success' ? (
            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}
          <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
            {dropToast.message}
          </span>
          <button
            onClick={() => setDropToast(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </aside>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="ClickPDF Protected System">
      <ThemeProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
