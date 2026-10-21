import React, { useState, useEffect, useRef } from 'react';
import { BlogPost } from '../types';
import { BookOpen, ArrowRight, ArrowLeft, X, Calendar, Clock, User, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getToolSeoInfo } from '../data/toolSeoData';
import { HIDDEN_TOOL_IDS, PUBLIC_PDF_TOOLS } from '../data/toolsData';

interface BlogSectionProps {
  articles: BlogPost[];
  activeArticleSlug?: string | null;
  onSelectArticle?: (article: BlogPost) => void;
  onCloseArticle?: () => void;
  onBackToHome?: () => void;
  onSelectTool?: (toolId: string) => void;
}

export const BlogSection: React.FC<BlogSectionProps> = ({
  articles,
  activeArticleSlug,
  onSelectArticle,
  onCloseArticle,
  onBackToHome,
  onSelectTool
}) => {
  const { t } = useLanguage();
  const [activeArticle, setActiveArticle] = useState<BlogPost | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const modalScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeArticleSlug) {
      const match = articles.find((a) => a.slug === activeArticleSlug);
      if (match) {
        setActiveArticle(match);
      }
    } else {
      setActiveArticle(null);
    }
  }, [activeArticleSlug, articles]);

  // Reset scroll and progress when article opens or changes
  useEffect(() => {
    if (activeArticle) {
      setReadingProgress(0);
      if (modalScrollRef.current) {
        modalScrollRef.current.scrollTop = 0;
      }
    }
  }, [activeArticle]);

  const handleScrollModal = () => {
    const el = modalScrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll <= 0) {
      setReadingProgress(100);
    } else {
      const pct = Math.min(100, Math.max(0, Math.round((scrollTop / maxScroll) * 100)));
      setReadingProgress(pct);
    }
  };

  const handleOpenArticle = (post: BlogPost) => {
    setActiveArticle(post);
    setReadingProgress(0);
    if (onSelectArticle) {
      onSelectArticle(post);
    }
  };

  const handleCloseArticle = () => {
    setActiveArticle(null);
    setReadingProgress(0);
    if (onCloseArticle) {
      onCloseArticle();
    }
  };

  /**
   * Resolves target PDF tool metadata for passing internal SEO link juice
   * and providing an actionable client-side CTA inside the article.
   */
  const getToolInfoForPost = (post: BlogPost) => {
    let toolId = post.targetTool;
    let toolUrl = post.targetToolUrl;
    let toolTitle = post.targetToolTitle;
    let ctaText = post.targetToolCta;

    if (toolId) {
      const seo = getToolSeoInfo(toolId);
      const toolObj = PUBLIC_PDF_TOOLS.find(t => t.id === toolId);
      if (seo) {
        toolUrl = toolUrl || `/tools/${seo.slug}`;
        toolTitle = toolTitle || seo.h1Title;
      } else if (toolObj) {
        toolUrl = toolUrl || `/tools/${toolObj.id}-pdf`;
        toolTitle = toolTitle || toolObj.title;
      }
    } else if (toolUrl) {
      const match = toolUrl.match(/\/tools\/([^/?#]+)/);
      if (match) {
        const seo = getToolSeoInfo(match[1]);
        if (seo) {
          toolId = seo.toolId;
          toolTitle = toolTitle || seo.h1Title;
        }
      }
    }

    // Contextual fallback based on article content
    if (!toolUrl) {
      const textCorpus = `${post.title} ${post.category} ${post.excerpt} ${post.content}`.toLowerCase();
      if (textCorpus.includes('compress') || textCorpus.includes('reduce') || textCorpus.includes('size')) {
        toolId = 'compress';
        toolUrl = '/tools/compress-pdf';
        toolTitle = 'Compress PDF Tool';
        ctaText = 'Compress PDFs Safely In Browser';
      } else if (textCorpus.includes('merge') || textCorpus.includes('combine') || textCorpus.includes('reorder')) {
        toolId = 'merge';
        toolUrl = '/tools/merge-pdf';
        toolTitle = 'Merge PDF Tool';
        ctaText = 'Merge & Reorder Official Documents';
      } else if (textCorpus.includes('watermark') || textCorpus.includes('confidential') || textCorpus.includes('stamp')) {
        toolId = 'watermark';
        toolUrl = '/tools/watermark-pdf';
        toolTitle = 'Watermark PDF Tool';
        ctaText = 'Stamp Confidential Watermarks on Your PDFs';
      } else if (textCorpus.includes('encrypt') || textCorpus.includes('password') || textCorpus.includes('protect')) {
        toolId = 'protect';
        toolUrl = '/tools/protect-pdf';
        toolTitle = 'AES-256 PDF Protect Tool';
        ctaText = 'Password-Protect PDF with Zero-Knowledge';
      } else if (textCorpus.includes('photo') || textCorpus.includes('image') || textCorpus.includes('portfolio')) {
        toolId = 'jpg-to-pdf';
        toolUrl = '/tools/image-to-pdf';
        toolTitle = 'Image to PDF Converter';
        ctaText = 'Convert Images & Photos to PDF Portfolios';
      } else if (textCorpus.includes('ocr') || textCorpus.includes('scanned') || textCorpus.includes('character recognition')) {
        toolId = 'metadata';
        toolUrl = '/tools/pdf-metadata';
        toolTitle = 'Inspect & OCR Tool';
        ctaText = 'Inspect & Extract Text from Scanned PDFs';
      } else {
        toolId = 'compress';
        toolUrl = '/tools/compress-pdf';
        toolTitle = 'Compress PDF Tool';
        ctaText = 'Open In-Browser PDF Tools';
      }
    }

    return {
      toolId: toolId || 'compress',
      toolUrl: toolUrl || '/tools/compress-pdf',
      toolTitle: toolTitle || 'Client-Side PDF Utility',
      ctaText: ctaText || `Open ${toolTitle || 'Tool'} In Browser`
    };
  };

  const renderHumanArticleContent = (rawText: string) => {
    if (!rawText) return null;

    // Split text into natural paragraphs
    const paragraphs = rawText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    return (
      <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed font-sans text-sm sm:text-base">
        {paragraphs.map((para, idx) => {
          // Strip accidental markdown artifacts
          const cleanPara = para
            .replace(/^#+\s*/gm, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`([^`]+)`/g, '$1')
            .trim();

          const isHeader =
            para.startsWith('#') ||
            (cleanPara.length < 80 &&
              !cleanPara.endsWith('.') &&
              !cleanPara.includes('\n') &&
              (cleanPara.endsWith(':') || idx > 0 && cleanPara.length < 60));

          if (isHeader && cleanPara.length < 85) {
            return (
              <h4
                key={idx}
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white pt-3 pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2"
              >
                <span className="w-1.5 h-4 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0" />
                <span>{cleanPara.replace(/:$/, '')}</span>
              </h4>
            );
          }

          if (cleanPara.includes('\n') && (/^(\d+\.|\-|\•)\s/m.test(cleanPara) || cleanPara.split('\n').length <= 5)) {
            const lines = cleanPara.split('\n').map((l) => l.trim()).filter(Boolean);
            return (
              <div key={idx} className="space-y-2.5 my-3 pl-1">
                {lines.map((line, lIdx) => {
                  const cleanLine = line
                    .replace(/^(\d+\.|\-|\•)\s*/, '')
                    .replace(/^#+\s*/, '')
                    .replace(/\*/g, '')
                    .trim();

                  const colonIdx = cleanLine.indexOf(':');
                  if (colonIdx > 0 && colonIdx < 35) {
                    const lead = cleanLine.substring(0, colonIdx);
                    const rest = cleanLine.substring(colonIdx + 1);
                    return (
                      <div key={lIdx} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          <strong className="font-semibold text-slate-900 dark:text-slate-100">{lead}:</strong>
                          <span>{rest}</span>
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div key={lIdx} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                      <p className="text-sm text-slate-700 dark:text-slate-300">{cleanLine}</p>
                    </div>
                  );
                })}
              </div>
            );
          }

          return (
            <p key={idx} className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              {cleanPara}
            </p>
          );
        })}
      </div>
    );
  };

  /**
   * Built-in Tool Call-To-Action (CTA) box rendered inside every blog post.
   * Renders semantic <a href="..."> linking directly to the relevant PDF tool
   * to pass SEO internal link equity, with instant SPA transition.
   */
  const renderToolCtaCard = (post: BlogPost) => {
    const toolInfo = getToolInfoForPost(post);
    if (toolInfo.toolId && HIDDEN_TOOL_IDS.has(toolInfo.toolId)) return null;

    return (
      <aside
        aria-label="Related PDF Tool"
        className="my-8 p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-white to-cyan-50/70 dark:from-indigo-950/60 dark:via-slate-900/90 dark:to-cyan-950/30 border border-indigo-200/90 dark:border-indigo-800/80 shadow-md transition-all"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>100% Client-Side Privacy</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-3 h-3" />
                <span>Recommended Free Tool</span>
              </span>
            </div>

            <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {toolInfo.toolTitle}
            </h4>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              Process this workflow right now directly in your web browser. No software installation, no accounts, and your confidential files are never uploaded to any cloud server.
            </p>
          </div>

          <div className="shrink-0">
            <a
              href={toolInfo.toolUrl}
              onClick={(e) => {
                if (onSelectTool && toolInfo.toolId) {
                  e.preventDefault();
                  handleCloseArticle();
                  onSelectTool(toolInfo.toolId);
                }
              }}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer group whitespace-nowrap"
              title={`Launch ${toolInfo.toolTitle}`}
            >
              <span>{toolInfo.ctaText}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </aside>
    );
  };

  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 border-t border-slate-200 dark:border-slate-800 transition-colors">
      {/* Subtle Progress Bar at the top of BlogSection when an article is open */}
      {activeArticle && (
        <div
          className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-200/50 dark:bg-slate-800/50 pointer-events-none"
          role="progressbar"
          aria-valuenow={readingProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Reading progress"
        >
          <div
            className="h-full bg-linear-to-r from-indigo-500 via-indigo-600 to-cyan-400 transition-all duration-150 ease-out shadow-xs shadow-indigo-500/50"
            style={{ width: `${readingProgress}%` }}
          />
        </div>
      )}

      {/* Back to Home / Tools Navigation (if on dedicated blog view) */}
      {onBackToHome && (
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to PDF Tools</span>
          </button>
        </div>
      )}

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
            <BookOpen className="w-4 h-4" />
            <span>{t.blogTag}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.blogTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            {t.blogSubtitle}
          </p>
        </div>
      </div>

      {/* Articles Grid with vivid cover images and semantic crawler links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {articles.map((post) => (
          <article
            key={post.id}
            className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer overflow-hidden"
            onClick={() => handleOpenArticle(post)}
          >
            <div>
              {/* Article Cover Image */}
              {post.coverImage && (
                <div className="relative w-full h-44 -mx-4 -mt-4 sm:-mx-5 sm:-mt-5 mb-4 overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-slate-950/75 backdrop-blur-xs text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
                    {post.category}
                  </div>
                </div>
              )}

              {/* Clean unboxed metadata */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                {!post.coverImage && (
                  <>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">{post.category}</span>
                    <span aria-hidden="true">·</span>
                  </>
                )}
                <span>{post.readTime}</span>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                <a
                  href={`/blog/${encodeURIComponent(post.slug)}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleOpenArticle(post);
                  }}
                  className="hover:underline focus:outline-none"
                >
                  {post.title}
                </a>
              </h3>

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                {post.excerpt}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
              <span>{post.date}</span>
              <a
                href={`/blog/${encodeURIComponent(post.slug)}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleOpenArticle(post);
                }}
                className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold group-hover:translate-x-0.5 transition-transform"
              >
                <span>{t.readBtn}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </article>
        ))}
      </div>

      {/* Reader Modal with Hero Image & Built-in Tool CTA */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            {/* Subtle Progress Bar embedded at the top of the reading modal */}
            <div className="absolute top-0 left-0 right-0 z-30 h-1 bg-slate-200/40 dark:bg-slate-800/40">
              <div
                className="h-full bg-linear-to-r from-indigo-500 via-indigo-600 to-cyan-400 transition-all duration-150 ease-out shadow-xs shadow-indigo-500/50"
                style={{ width: `${readingProgress}%` }}
              />
            </div>

            {/* Modal Hero Cover Image */}
            {activeArticle.coverImage && (
              <div className="relative w-full h-48 sm:h-64 overflow-hidden bg-slate-900 shrink-0">
                <img
                  src={activeArticle.coverImage}
                  alt={activeArticle.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                <button
                  onClick={handleCloseArticle}
                  className="absolute top-4 right-4 p-2 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full transition-colors cursor-pointer backdrop-blur-xs"
                  aria-label="Close article"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between gap-3">
                  <span className="px-2.5 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider">
                    {activeArticle.category}
                  </span>
                  {activeArticle.targetToolUrl && (
                    <a
                      href={activeArticle.targetToolUrl}
                      onClick={(e) => {
                        if (onSelectTool && activeArticle.targetTool) {
                          e.preventDefault();
                          handleCloseArticle();
                          onSelectTool(activeArticle.targetTool);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 hover:bg-white text-slate-900 text-xs font-bold transition-all shadow-sm"
                    >
                      <span>{activeArticle.targetToolTitle || 'Try Tool'}</span>
                      <ExternalLink className="w-3 h-3 text-indigo-600" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/70 dark:bg-slate-900/90 shrink-0">
              <div>
                <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-2 flex-wrap">
                  {!activeArticle.coverImage && <span>{activeArticle.category} · </span>}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {activeArticle.readTime}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {activeArticle.date}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                  {activeArticle.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                  <User className="w-3 h-3" />
                  <span>By {activeArticle.author}</span>
                </p>
              </div>

              {!activeArticle.coverImage && (
                <button
                  onClick={handleCloseArticle}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer shrink-0 ml-4"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div
              ref={modalScrollRef}
              onScroll={handleScrollModal}
              className="p-6 overflow-y-auto space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed custom-scrollbar"
            >
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-base leading-relaxed bg-indigo-50/60 dark:bg-indigo-950/40 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                {activeArticle.excerpt}
              </p>

              <div className="pt-2">
                {renderHumanArticleContent(activeArticle.content)}
              </div>

              {/* Built-in Tool Call-To-Action (CTA) */}
              {renderToolCtaCard(activeArticle)}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
              <div className="flex items-center gap-2">
                <span>{t.publishedBy}</span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {readingProgress}% Read
                </span>
              </div>
              <div className="flex items-center gap-2">
                {activeArticle.targetToolUrl && (
                  <a
                    href={activeArticle.targetToolUrl}
                    onClick={(e) => {
                      if (onSelectTool && activeArticle.targetTool) {
                        e.preventDefault();
                        handleCloseArticle();
                        onSelectTool(activeArticle.targetTool);
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors cursor-pointer text-xs flex items-center gap-1.5"
                  >
                    <span>{activeArticle.targetToolTitle || 'Try Tool'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={handleCloseArticle}
                  className="px-5 py-2 bg-slate-900 dark:bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-sm"
                >
                  {t.doneReadingBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
