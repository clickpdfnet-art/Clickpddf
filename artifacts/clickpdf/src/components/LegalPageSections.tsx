import React from 'react';
import { ExternalLink, Mail } from 'lucide-react';
import { LEGAL_PAGES, LegalPageDefinition } from '../data/legalPages';
import { getLocalizedLegalPage } from '../i18n/legalPageTranslations';
import { LEGAL_INTERFACE_TRANSLATIONS } from '../i18n/legalInterfaceTranslations';
import { buildAppPath } from '../utils/routeParser';
import { useLanguage } from '../context/LanguageContext';

interface LegalPageSectionsProps {
  page: LegalPageDefinition;
  showRelatedPages?: boolean;
}

export const LegalPageSections: React.FC<LegalPageSectionsProps> = ({
  page,
  showRelatedPages = true,
}) => {
  const { language } = useLanguage();
  const copy = getLocalizedLegalPage(page.id, language);
  const ui = LEGAL_INTERFACE_TRANSLATIONS[language];

  return (
    <>
      <div className="space-y-7">
        {copy.sections.map((section, index) => (
          <section
            key={`${page.id}-${index}`}
            aria-labelledby={`legal-${page.id}-${index + 1}`}
          >
            <h2
              id={`legal-${page.id}-${index + 1}`}
              className="text-start text-base font-bold text-slate-900 dark:text-white"
            >
              {section.heading}
            </h2>
            <div className="mt-2 space-y-3 text-start text-sm leading-7 text-slate-600 dark:text-slate-300">
              {section.paragraphs.map((paragraph, paragraphIndex) => (
                <p key={`${page.id}-${index}-${paragraphIndex}`}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}

        {page.id === 'contact' && page.contactEmail && (
          <a
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950"
            href={`mailto:${page.contactEmail}`}
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            {ui.emailSupport}: {page.contactEmail}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        )}
      </div>

      {showRelatedPages && (
        <nav
          aria-label={ui.relatedPages}
          className="mt-7 border-t border-slate-200 pt-6 text-start dark:border-slate-800"
        >
          <h2 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">
            {ui.relatedPages}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {LEGAL_PAGES.filter((candidate) => candidate.id !== page.id).map((candidate) => {
              const localizedCandidate = getLocalizedLegalPage(candidate.id, language);
              return (
                <li key={candidate.id}>
                  <a
                    href={buildAppPath(candidate.path)}
                    className="inline-flex rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-indigo-200 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-800 dark:hover:text-indigo-300"
                  >
                    {localizedCandidate.heading}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </>
  );
};
