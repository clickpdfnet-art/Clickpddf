import React from 'react';
import { ShieldCheck, Zap, Share2, ExternalLink, LayoutDashboard, HelpCircle, Newspaper, Info, Mail, Cookie, FileText } from 'lucide-react';
import { ToolCategory } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { PWAInstallButton } from './PWAInstallButton';
import { LegalModalTab } from './LegalModal';
import { BrandLogo } from './BrandLogo';
import { buildAppPath } from '../utils/routeParser';

interface FooterProps {
  onSelectCategory: (cat: ToolCategory) => void;
  onOpenBlog: () => void;
  onOpenAdmin: () => void;
  onOpenSitemap?: () => void;
  onOpenFaq?: () => void;
  onOpenBatchQueue?: () => void;
  onOpenLegal?: (tab: LegalModalTab) => void;
  onOpenShare?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectCategory,
  onOpenBlog,
  onOpenAdmin,
  onOpenSitemap,
  onOpenFaq,
  onOpenBatchQueue,
  onOpenLegal,
  onOpenShare
}) => {
  const { t, getToolTitle } = useLanguage();

  const handleOpenBlog = () => {
    onOpenBlog();
  };

  const handleOpenFaq = () => {
    if (onOpenFaq) onOpenFaq();
  };

  return (
    <footer className="w-full bg-slate-950 text-slate-400 text-xs border-t border-slate-900/80 pt-6 sm:pt-8 pb-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,1fr))] gap-x-4 sm:gap-x-6 gap-y-4 sm:gap-y-6 pb-4 sm:pb-5 md:items-start md:[&>div]:min-w-0 md:[&_button]:text-start md:[&_a]:text-start md:[&_svg]:shrink-0">
          {/* Keep mobile unchanged; give desktop links four evenly sized columns. */}
          <div className="col-span-2 md:col-span-4 xl:col-span-1">
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="text-white font-extrabold text-xl sm:text-2xl tracking-tight leading-none">Click</span>
              <BrandLogo className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 aspect-square drop-shadow-md" />
            </div>

            <p className="text-slate-400 text-xs leading-relaxed max-w-sm mb-2.5">
              ClickPDF.net provides 100% in-browser, client-side PDF utilities developed by Click Digital Services. All document operations execute strictly within local device memory with zero server uploads.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t.zeroServerGuarantee}</span>
              </div>
              {onOpenShare && (
                <button
                  type="button"
                  onClick={onOpenShare}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3 h-3 text-amber-400" />
                  <span>{t.shareClickPdf}</span>
                </button>
              )}
            </div>
          </div>

          {/* Column 1: Core Tools */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-1.5 sm:mb-2">
              {t.allPdfTools}
            </h4>
            <ul className="space-y-1 sm:space-y-1.5 text-slate-400">
              <li>
                <button onClick={() => onSelectCategory('organize')} className="hover:text-white transition-colors cursor-pointer">
                  {getToolTitle('merge')}
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('organize')} className="hover:text-white transition-colors cursor-pointer">
                  {getToolTitle('split')}
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('optimize')} className="hover:text-white transition-colors cursor-pointer">
                  {getToolTitle('compress')}
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('convert')} className="hover:text-white transition-colors cursor-pointer">
                  {getToolTitle('jpg-to-pdf')}
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('organize')} className="hover:text-white transition-colors cursor-pointer">
                  {getToolTitle('rotate')}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Edit & Security */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-1.5 sm:mb-2">
              {t.catEdit} & {t.catSecurity}
            </h4>
            <ul className="space-y-1 sm:space-y-1.5 text-slate-400">
              <li>
                <button onClick={() => onSelectCategory('edit')} className="hover:text-white transition-colors cursor-pointer">
                  {getToolTitle('watermark')}
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('edit')} className="hover:text-white transition-colors cursor-pointer">
                  {getToolTitle('page-numbers')}
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('security')} className="hover:text-white transition-colors cursor-pointer">
                  {getToolTitle('protect')}
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('security')} className="hover:text-white transition-colors cursor-pointer">
                  {getToolTitle('unlock')}
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('organize')} className="hover:text-white transition-colors cursor-pointer">
                  {getToolTitle('organize')}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Company & Policies */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-1.5 sm:mb-2">
              {t.companyAndLegal}
            </h4>
            <ul className="space-y-1 sm:space-y-1.5 text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegal ? onOpenLegal('about') : null}
                  className="hover:text-white transition-colors cursor-pointer text-slate-300 hover:text-white flex items-center gap-1.5"
                >
                  <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{t.aboutUs}</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegal ? onOpenLegal('contact') : null}
                  className="hover:text-white transition-colors cursor-pointer text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 font-medium"
                >
                  <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{t.contactUs}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 font-bold">24/7</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegal ? onOpenLegal('cookies') : null}
                  className="hover:text-white transition-colors cursor-pointer text-amber-400 hover:text-amber-300 flex items-center gap-1.5"
                >
                  <Cookie className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{t.cookiesPolicy}</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegal ? onOpenLegal('privacy') : null}
                  className="hover:text-white transition-colors cursor-pointer text-slate-300 hover:text-white flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{t.privacyPolicy}</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegal ? onOpenLegal('terms') : null}
                  className="hover:text-white transition-colors cursor-pointer text-slate-300 hover:text-white flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{t.termsOfService}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Resources & Admin */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-1.5 sm:mb-2">
              {t.resourcesAndTools}
            </h4>
            <ul className="space-y-1 sm:space-y-1.5 text-slate-400">
              <li>
                <PWAInstallButton variant="footer" />
              </li>
              {onOpenBatchQueue && (
                <li>
                  <button onClick={onOpenBatchQueue} className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300">
                    <span>{t.batchQueueEngine}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">New</span>
                  </button>
                </li>
              )}
              {/* Blogs link */}
              <li>
                <a
                  href={buildAppPath('/blog')}
                  onClick={(e) => {
                    e.preventDefault();
                    handleOpenBlog();
                  }}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-slate-300 hover:text-white group"
                  title="Open ClickPDF Knowledge Base & Blogs"
                >
                  <Newspaper className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-300 shrink-0" />
                  <span className="font-medium">{t.blogs}</span>
                </a>
              </li>
              {/* FAQs link */}
              <li>
                <button
                  type="button"
                  onClick={handleOpenFaq}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-slate-300 hover:text-white group"
                  title="Open FAQs"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-cyan-400 group-hover:text-cyan-300 shrink-0" />
                  <span className="font-medium">{t.faqAndAnswers}</span>
                </button>
              </li>
              {/* 1-Click Admin Dashboard */}
              <li>
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-indigo-300 hover:text-indigo-200 group font-semibold"
                  title="Open Admin Dashboard directly"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-300 shrink-0" />
                  <span>{t.adminDashboard}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 font-bold">Direct</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-3 border-t border-slate-900/80 flex items-center justify-center text-center text-[11px] sm:text-xs text-slate-400">
          <div>
            © {new Date().getFullYear()} ClickPDF.net — A Product by Click Digital Services
          </div>
        </div>
      </div>
    </footer>
  );
};
