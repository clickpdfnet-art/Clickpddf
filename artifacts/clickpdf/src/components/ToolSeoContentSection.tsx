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
import { getToolCanonicalPath, ToolSeoInfo } from '../data/toolSeoData';
import { PUBLIC_PDF_TOOLS } from '../data/toolsData';
import { useLanguage } from '../context/LanguageContext';
import { TOOL_PAGE_TRANSLATIONS } from '../i18n/toolPageTranslations';
import { getToolPrivacyCopy } from '../data/toolPrivacyTranslations';
import { getLocalizedToolPageSeoContent, getToolPageSeoLabels, hasLocalizedToolPageSeoContent } from '../data/toolPageSeoContent';

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
  const { ui, language, getToolTitle, getToolDescription } = useLanguage();
  const copy = TOOL_PAGE_TRANSLATIONS[language];
  const specificContent = getLocalizedToolPageSeoContent(tool.id, language);
  const translatedLabels = getToolPageSeoLabels(language);

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
  const toolName = getToolTitle(tool);
  const toolPrivacyCopy = getToolPrivacyCopy(language, tool.id);
  const isEnglishSeoPage = language === 'en';
  const isEnglishMetadataPage = tool.id === 'edit-metadata' && language === 'en';
  const relatedToolHref = (toolId: string) => {
    const path = getToolCanonicalPath(toolId);
    const localizedPath = language !== 'en' && hasLocalizedToolPageSeoContent(toolId, language)
      ? `/${language}${path}`
      : path;
    return localizedPath.endsWith('/') ? localizedPath : `${localizedPath}/`;
  };
  const localizedSteps = specificContent?.steps ?? (isEnglishSeoPage ? seoInfo.steps : [
    { step: 1, title: copy.step1Title, description: copy.step1Description },
    { step: 2, title: copy.step2Title, description: copy.step2Description },
    { step: 3, title: copy.step3Title, description: copy.step3Description },
  ]);
  const localizeFaqQuestion = (question: string) =>
    question.replace(/\{toolName\}/g, toolName);
  const localizedFaqs = specificContent?.faqs ?? (isEnglishSeoPage ? seoInfo.faqs : [
    {
      question: localizeFaqQuestion(copy.faqPrivacyQuestion),
      answer: copy.faqPrivacyAnswer,
    },
    {
      question: localizeFaqQuestion(copy.faqLimitsQuestion),
      answer: copy.faqLimitsAnswer,
    },
    {
      question: localizeFaqQuestion(copy.faqCompatibilityQuestion),
      answer: copy.faqCompatibilityAnswer,
    },
  ]);

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
              <a
                key={relTool.id}
                href={relatedToolHref(relTool.id)}
                onClick={(event) => {
                  if (!onSelectRelatedTool) return;
                  event.preventDefault();
                  onSelectRelatedTool(relTool);
                }}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 text-start cursor-pointer transition-all group flex flex-col justify-between h-24"
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
              </a>
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
        <section
          aria-label={copy.quickAnswerLabel}
          className="rounded-xl border border-indigo-100 dark:border-indigo-900/70 bg-indigo-50/60 dark:bg-indigo-950/30 px-5 py-4 text-sm text-slate-700 dark:text-slate-200 leading-relaxed"
        >
          <p>
            <strong className="text-slate-900 dark:text-white">{copy.quickAnswerLabel}:</strong>{' '}
            {isEnglishMetadataPage ? tool.description : getToolDescription(tool)}
          </p>
        </section>

        {/* Keyword-Rich Heading and Badges */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            {isEnglishMetadataPage ? (
              <span>{seoInfo.badge}</span>
            ) : (
              <>
                <span>{ui.inBrowserShort}</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span>{ui.freeUnlimitedBadge}</span>
              </>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {toolName}
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {toolPrivacyCopy.summary}
          </p>
        </div>


        {/* Supplemental metadata guidance */}
        {isEnglishSeoPage && (
          <div className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>{seoInfo.overviewHeading}</span>
            </h4>
            <p>{seoInfo.overview}</p>
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              {seoInfo.secondaryOverview}
            </p>
          </div>
        )}

        {isEnglishMetadataPage && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {seoInfo.benefits.map((benefit) => (
              <section key={benefit.title} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{benefit.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{benefit.desc}</p>
              </section>
            ))}
          </div>
        )}

        {/* 3. Step-by-Step How-To Instructions */}
        <div className="space-y-4 text-center">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {specificContent?.stepsHeading || (isEnglishSeoPage ? seoInfo.stepsHeading : `${ui.howToSectionHeading} ${getToolTitle(tool)}`)}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {localizedSteps.map((s) => (
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
              {translatedLabels?.faq || ui.faqHeadingPrefix} {getToolTitle(tool)}
            </h3>
          </div>

          <div className="space-y-2">
            {localizedFaqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div 
                  key={index}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full px-5 py-4 text-start flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
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
                <a
                  key={relTool.id}
                  href={relatedToolHref(relTool.id)}
                  onClick={(event) => {
                    if (!onSelectRelatedTool) return;
                    event.preventDefault();
                    onSelectRelatedTool(relTool);
                  }}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 text-start cursor-pointer transition-all group flex flex-col justify-between h-24"
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
                </a>
              ))}
            </div>
          </div>
        )}

      </div>
    </article>
  );
};
