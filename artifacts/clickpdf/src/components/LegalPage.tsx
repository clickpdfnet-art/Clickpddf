import React from 'react';
import { Info, FileText, Mail, ShieldCheck } from 'lucide-react';
import { LegalPageDefinition } from '../data/legalPages';
import { getLocalizedLegalPage } from '../i18n/legalPageTranslations';
import { LEGAL_INTERFACE_TRANSLATIONS } from '../i18n/legalInterfaceTranslations';
import { useLanguage } from '../context/LanguageContext';
import { LegalPageSections } from './LegalPageSections';
import { buildAppPath } from '../utils/routeParser';

interface LegalPageProps {
  page: LegalPageDefinition;
}

const PAGE_ICONS = {
  about: Info,
  contact: Mail,
  privacy: ShieldCheck,
  terms: FileText,
  cookies: ShieldCheck,
  disclaimer: FileText,
} as const;

export const LegalPage: React.FC<LegalPageProps> = ({ page }) => {
  const Icon = PAGE_ICONS[page.id];
  const { language } = useLanguage();
  const copy = getLocalizedLegalPage(page.id, language);
  const ui = LEGAL_INTERFACE_TRANSLATIONS[language];

  return (
    <div className="min-h-[75vh] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <nav aria-label={ui.breadcrumb} className="mb-5 text-start text-xs text-slate-500 dark:text-slate-400">
          <a href={buildAppPath('/')} className="hover:text-indigo-600 dark:hover:text-indigo-400">
            ClickPDF
          </a>
          <span className="mx-2" aria-hidden="true">/</span>
          <span aria-current="page">{copy.heading}</span>
        </nav>

        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <header className="border-b border-slate-100 bg-gradient-to-br from-white to-indigo-50/60 p-6 sm:p-8 dark:border-slate-800 dark:from-slate-900 dark:to-indigo-950/20">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-600 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              ClickPDF · Click Digital Services
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              {copy.heading}
            </h1>
            <p className="mt-3 max-w-3xl text-start text-sm leading-6 text-slate-600 dark:text-slate-300">
              {copy.description}
            </p>
          </header>

          <div className="space-y-7 p-6 sm:p-8">
            <LegalPageSections page={page} />
          </div>
        </article>
      </div>
    </div>
  );
};
