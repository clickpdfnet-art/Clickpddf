import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight
} from 'lucide-react';
import { PDFTool } from '../types';
import { ToolSeoInfo } from '../data/toolSeoData';
import { PUBLIC_PDF_TOOLS } from '../data/toolsData';
import { useLanguage } from '../context/LanguageContext';

export type ToolSeoStage = 'empty' | 'active' | 'completed';

interface ToolSeoContentSectionProps {
  tool: PDFTool;
  seoInfo?: ToolSeoInfo;
  onSelectRelatedTool?: (tool: PDFTool) => void;
  stage?: ToolSeoStage;
}

export const ToolSeoContentSection: React.FC<ToolSeoContentSectionProps> = ({
  tool,
  seoInfo,
  onSelectRelatedTool,
  stage = 'empty'
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const { ui, getToolTitle, getToolDescription } = useLanguage();

  if (!seoInfo) {
    return null;
  }

  // Stage 2: Active File State (When file is selected/dropped):
  // Keep all internal tool UI intact, and ONLY hide the external SEO text sections below the tool
  if (stage === 'active') {
    return null;
  }

  const relatedTools = (seoInfo.relatedToolIds || [])
    .map((id) => PUBLIC_PDF_TOOLS.find((t) => t.id === id))
    .filter((t): t is PDFTool => Boolean(t));

  // Stage 3: Completed / Download State (When processing finishes & Download button appears):
  // Keep long SEO sections (How-To Steps and FAQs, Privacy Banner) hidden, and ONLY show 'Related Tools' section below the download area
  if (stage === 'completed') {
    if (relatedTools.length === 0) return null;
    return (
      <aside aria-label={ui.relatedToolsHeading} className="w-full mt-10 pt-8 border-t border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {ui.relatedToolsHeading}
            </h3>
            <span className="text-xs text-slate-500">{ui.inBrowserShort}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {relatedTools.map((relTool) => (
              <button
                key={relTool.id}
                type="button"
                onClick={() => onSelectRelatedTool && onSelectRelatedTool(relTool)}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 text-left cursor-pointer transition-all group flex flex-col justify-between h-24"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {getToolTitle(relTool)}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {getToolDescription(relTool)}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                  <span>{ui.openToolLabel}</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>
    );
  }


  return (
    <article className="w-full mt-12 pt-10 border-t border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100">
      {/* 1. Tool Overview & In-Browser Privacy Hero Section */}
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Keyword-Rich Heading and Badges */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span>{seoInfo.badge}</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>{ui.freeUnlimitedBadge}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {seoInfo.h1Title}
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {seoInfo.overview}
          </p>
        </div>


        {/* Secondary In-Depth Details */}
        <div className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>{ui.aboutToolSectionHeading}</span>
          </h4>
          <p>{seoInfo.secondaryOverview}</p>
        </div>

        {/* 3. Step-by-Step How-To Instructions */}
        <div className="space-y-4 text-center">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {ui.howToSectionHeading} {getToolTitle(tool)}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {seoInfo.steps.map((s) => (
              <div 
                key={s.step} 
                className="p-5 rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 relative hover:border-indigo-400/50 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mx-auto mb-3 shadow-xs">
                  {s.step}
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  {s.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Tool-Specific FAQs (Accordion) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {ui.faqHeadingPrefix} {getToolTitle(tool)}
            </h3>
          </div>

          <div className="space-y-2">
            {seoInfo.faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div 
                  key={index}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                      {faq.question}
                    </span>
                    <span className="text-slate-400 shrink-0">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/50 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. Related PDF Tools (Internal Linking for SEO Crawler Depth) */}
        {relatedTools.length > 0 && (
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {ui.relatedToolsHeading}
              </h3>
              <span className="text-xs text-slate-500">{ui.inBrowserShort}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {relatedTools.map((relTool) => (
                <button
                  key={relTool.id}
                  type="button"
                  onClick={() => onSelectRelatedTool && onSelectRelatedTool(relTool)}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 text-left cursor-pointer transition-all group flex flex-col justify-between h-24"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {getToolTitle(relTool)}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {getToolDescription(relTool)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                    <span>{ui.openToolLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </article>
  );
};
