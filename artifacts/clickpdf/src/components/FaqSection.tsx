import React, { useState, useMemo, useEffect } from 'react';
import {
  HelpCircle,
  ShieldCheck,
  Search,
  CheckCircle2,
  Lock,
  Cpu,
  Layers,
  FileCheck,
  ArrowRight,
  ArrowLeft,
  X,
  BookOpen,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';
import { FAQ_DATA } from '../data/faqData';
import { FaqItem } from '../types';

interface FaqSectionProps {
  onScrollToTools?: () => void;
  onBackToHome?: () => void;
  isStandaloneView?: boolean;
}

export const FaqSection: React.FC<FaqSectionProps> = ({
  onScrollToTools,
  onBackToHome,
  isStandaloneView = false
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFaqForModal, setSelectedFaqForModal] = useState<FaqItem | null>(null);
  const [copiedAnswer, setCopiedAnswer] = useState<boolean>(false);

  // Close modal with ESC and prevent background scroll
  useEffect(() => {
    if (!selectedFaqForModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedFaqForModal(null);
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedFaqForModal]);

  // Filter FAQs based on category & search term
  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q) ||
        (item.highlights && item.highlights.some((h) => h.toLowerCase().includes(q)));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const categories = [
    { id: 'all', label: 'All Questions', count: FAQ_DATA.length },
    { id: 'security', label: 'Privacy & Security', count: FAQ_DATA.filter(f => f.category === 'security').length },
    { id: 'technology', label: 'How It Works', count: FAQ_DATA.filter(f => f.category === 'technology').length },
    { id: 'compliance', label: 'Compliance & Safety', count: FAQ_DATA.filter(f => f.category === 'compliance').length },
    { id: 'performance', label: 'Limits & Performance', count: FAQ_DATA.filter(f => f.category === 'performance').length },
    { id: 'features', label: 'Features & OCR', count: FAQ_DATA.filter(f => f.category === 'features').length }
  ];

  // Schema.org FAQPage JSON-LD for rich snippets and SEO
  const faqSchema = useMemo(() => {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ_DATA.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer
        }
      }))
    };
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security':
        return <Lock className="w-4 h-4" />;
      case 'technology':
        return <Cpu className="w-4 h-4" />;
      case 'compliance':
        return <ShieldCheck className="w-4 h-4" />;
      case 'features':
        return <FileCheck className="w-4 h-4" />;
      default:
        return <Layers className="w-4 h-4" />;
    }
  };

  return (
    <section id="faq-section" className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-16 sm:py-20 transition-colors">
      {/* Embedded Schema.org FAQPage for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Standalone View Back Navigation */}
        {isStandaloneView && onBackToHome && (
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={onBackToHome}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to PDF Tools</span>
            </button>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Official ClickPDF Documentation & Answers</span>
            </div>
          </div>
        )}

        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Trust & Technology FAQ</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Clear answers about in-browser processing, privacy architecture, zero uploads, and PDF specifications.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions (e.g. upload, privacy, OCR, limits)..."
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 self-end sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Showing <strong>{filteredFaqs.length}</strong> Questions</span>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      active
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3x3 Grid of Questions: Line 1 (3), Line 2 (3), Line 3 (3) */}
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No matching questions found
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Try searching with different keywords like "upload", "privacy", or "safe".
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:gap-5 md:gap-6">
            {filteredFaqs.map((faq, idx) => {
              return (
                <div
                  key={faq.id}
                  onClick={() => setSelectedFaqForModal(faq)}
                  className="bg-white dark:bg-slate-850 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-xs hover:shadow-xl transition-all duration-200 flex flex-col justify-between group cursor-pointer relative"
                >
                  <div>
                    {/* Category badge & Index counter */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-900 px-2.5 py-0.5 rounded-full truncate max-w-[75%]">
                        {faq.categoryLabel}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                          {getCategoryIcon(faq.category)}
                        </div>
                      </div>
                    </div>

                    {/* Prominent Bold Question Header */}
                    <h3 className="text-xs sm:text-base md:text-lg font-black text-slate-950 dark:text-white leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-3 mb-2.5">
                      {faq.question}
                    </h3>

                    {/* Excerpt preview */}
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 mb-4">
                      {faq.answer}
                    </p>
                  </div>

                  {/* Read More Button -> Opens Full Page View */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFaqForModal(faq);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all shadow-2xs group-hover:bg-indigo-600 group-hover:text-white cursor-pointer"
                    >
                      <span>Read More</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </button>
                    <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                      Read full page
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Trust Verification Card */}
        <div className="mt-12 rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 border border-indigo-800/60 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero Server Uploads Verified</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Inspect Memory & Local Network Activity
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Open Developer Tools (F12) &gt; Network tab on any tool. Notice that when uploading or generating files, 0 requests leave your browser.
              </p>
            </div>

            {onScrollToTools && (
              <button
                onClick={onScrollToTools}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs sm:text-sm font-bold shadow-lg transition-transform active:scale-95 cursor-pointer shrink-0"
              >
                Try All PDF Tools Free
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Full Page View Modal for Read More */}
      {selectedFaqForModal && (
        <div
          onClick={() => setSelectedFaqForModal(null)}
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden cursor-default"
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                  {getCategoryIcon(selectedFaqForModal.category)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-100/70 dark:bg-indigo-950/70 px-2.5 py-0.5 rounded-full inline-block">
                      {selectedFaqForModal.categoryLabel}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      2 min read · Knowledge Base
                    </span>
                  </div>
                  <h3 className="text-base sm:text-xl font-black text-slate-950 dark:text-white leading-snug">
                    {selectedFaqForModal.question}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFaqForModal(null)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer shrink-0"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Full Read More Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed custom-scrollbar">
              <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 text-slate-900 dark:text-slate-100 font-medium leading-relaxed text-sm sm:text-base">
                {selectedFaqForModal.answer}
              </div>

              {/* Key Guarantees & Highlights */}
              {selectedFaqForModal.highlights && selectedFaqForModal.highlights.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Technical Highlights & Guarantees</span>
                  </h4>
                  <div className="space-y-2">
                    {selectedFaqForModal.highlights.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Standard ISO & Privacy Note */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>100% Client-Side In-Browser Execution · Zero Server Telemetry · ISO 32000 Compliant</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`${selectedFaqForModal.question}\n\n${selectedFaqForModal.answer}`);
                  setCopiedAnswer(true);
                  setTimeout(() => setCopiedAnswer(false), 2000);
                }}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedAnswer ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Answer</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelectedFaqForModal(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
