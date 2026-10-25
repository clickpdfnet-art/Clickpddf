import React from 'react';
import { ExternalLink, FileText, Info, Mail, ShieldCheck } from 'lucide-react';
import { LEGAL_PAGES, LegalPageDefinition } from '../data/legalPages';
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

  return (
    <div className="min-h-[75vh] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <nav aria-label="Breadcrumb" className="mb-5 text-xs text-slate-500 dark:text-slate-400">
          <a href={buildAppPath('/')} className="hover:text-indigo-600 dark:hover:text-indigo-400">
            ClickPDF
          </a>
          <span className="mx-2" aria-hidden="true">/</span>
          <span aria-current="page">{page.heading}</span>
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
              {page.heading}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              {page.description}
            </p>
          </header>

          <div className="space-y-7 p-6 sm:p-8">
            {page.sections.map((section) => (
              <section key={section.heading} aria-labelledby={`legal-${page.id}-${section.heading.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`}>
                <h2
                  id={`legal-${page.id}-${section.heading.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`}
                  className="text-base font-bold text-slate-900 dark:text-white"
                >
                  {section.heading}
                </h2>
                <div className="mt-2 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                {page.id === 'contact' && section.heading === 'Email support' && page.contactEmail && (
                  <a
                    className="mt-3 inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950"
                    href={`mailto:${page.contactEmail}`}
                  >
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    {page.contactEmail}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                )}
              </section>
            ))}

            <nav aria-label="Other company and policy pages" className="border-t border-slate-200 pt-6 dark:border-slate-800">
              <h2 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">Related pages</h2>
              <ul className="flex flex-wrap gap-2">
                {LEGAL_PAGES.filter((candidate) => candidate.id !== page.id).map((candidate) => (
                  <li key={candidate.id}>
                    <a
                      href={buildAppPath(candidate.path)}
                      className="inline-flex rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-indigo-200 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-800 dark:hover:text-indigo-300"
                    >
                      {candidate.heading}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </article>
      </div>
    </div>
  );
};
