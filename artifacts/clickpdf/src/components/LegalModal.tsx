import React, { FormEvent, useEffect, useState } from 'react';
import {
  Cookie,
  FileText,
  Info,
  Mail,
  ShieldCheck,
  X,
} from 'lucide-react';
import { LegalPageId, LEGAL_PAGES, getLegalPageById } from '../data/legalPages';
import { LEGAL_INTERFACE_TRANSLATIONS } from '../i18n/legalInterfaceTranslations';
import { getLocalizedLegalPage } from '../i18n/legalPageTranslations';
import { useLanguage } from '../context/LanguageContext';
import { buildAppPath } from '../utils/routeParser';
import { LegalPageSections } from './LegalPageSections';

export type LegalModalTab = LegalPageId;

interface LegalModalProps {
  isOpen: boolean;
  initialTab: LegalModalTab;
  onClose: () => void;
}

const PAGE_ICONS = {
  about: Info,
  contact: Mail,
  privacy: ShieldCheck,
  terms: FileText,
  cookies: Cookie,
  disclaimer: Info,
} satisfies Record<LegalPageId, typeof Info>;

const CONTACT_CATEGORIES = [
  ['feedback', 'feedback'],
  ['bug-report', 'bugReport'],
  ['feature-request', 'featureRequest'],
  ['partnership', 'partnership'],
  ['privacy-question', 'privacyQuestion'],
  ['other', 'otherInquiry'],
] as const;

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  initialTab,
  onClose,
}) => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<LegalModalTab>(initialTab);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactCategory, setContactCategory] = useState<string>('feedback');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const ui = LEGAL_INTERFACE_TRANSLATIONS[language];
  const activePage = getLegalPageById(activeTab) ?? LEGAL_PAGES[0];
  const pageCopy = getLocalizedLegalPage(activePage.id, language);

  useEffect(() => {
    setActiveTab(initialTab);
    setContactSubmitted(false);
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setContactSubmitted(true);
  };

  const resetContactForm = () => {
    setContactSubmitted(false);
    setContactName('');
    setContactEmail('');
    setContactCategory('feedback');
    setContactSubject('');
    setContactMessage('');
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
        aria-describedby="legal-modal-description"
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
          <div className="min-w-0">
            <p
              id="legal-modal-description"
              className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400"
            >
              {ui.subtitle}
            </p>
            <h2
              id="legal-modal-title"
              className="mt-1 truncate text-lg font-bold text-slate-950 dark:text-white"
            >
              {pageCopy.heading}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={buildAppPath(activePage.path)}
              className="hidden items-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900 sm:inline-flex"
            >
              {ui.openFullPage}
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label={ui.closeModal}
              title={ui.closeModal}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        <nav
          aria-label={ui.relatedPages}
          className="flex gap-1 overflow-x-auto border-b border-slate-200 px-3 py-2 dark:border-slate-800 sm:px-5"
        >
          {LEGAL_PAGES.map((page) => {
            const Icon = PAGE_ICONS[page.id];
            const localized = getLocalizedLegalPage(page.id, language);
            const selected = activeTab === page.id;
            return (
              <button
                key={page.id}
                type="button"
                onClick={() => {
                  setActiveTab(page.id);
                  setContactSubmitted(false);
                }}
                aria-current={selected ? 'page' : undefined}
                className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  selected
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {localized.heading}
              </button>
            );
          })}
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="p-5 sm:p-7">
            <p className="mb-6 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              {pageCopy.description}
            </p>
            <LegalPageSections page={activePage} showRelatedPages={false} />

            {activeTab === 'contact' && (
              <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
                {contactSubmitted ? (
                  <div
                    role="status"
                    className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/30"
                  >
                    <h3 className="font-bold text-emerald-900 dark:text-emerald-200">
                      {ui.successTitle}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-emerald-800 dark:text-emerald-300">
                      {ui.successBody.replace(/\{name\}/g, contactName || contactEmail)}
                    </p>
                    <button
                      type="button"
                      onClick={resetContactForm}
                      className="mt-4 text-sm font-semibold text-emerald-800 underline dark:text-emerald-200"
                    >
                      {ui.sendAnother}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        {ui.contactName}
                        <input
                          required
                          value={contactName}
                          onChange={(event) => setContactName(event.target.value)}
                          placeholder={ui.contactNamePlaceholder}
                          className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                      </label>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        {ui.contactEmail}
                        <input
                          required
                          type="email"
                          value={contactEmail}
                          onChange={(event) => setContactEmail(event.target.value)}
                          placeholder={ui.contactEmailPlaceholder}
                          className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                      </label>
                    </div>

                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                      {ui.contactTopic}
                      <select
                        value={contactCategory}
                        onChange={(event) => setContactCategory(event.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      >
                        {CONTACT_CATEGORIES.map(([value, labelKey]) => (
                          <option key={value} value={value}>
                            {ui[labelKey]}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                      {ui.contactSubject}
                      <input
                        required
                        value={contactSubject}
                        onChange={(event) => setContactSubject(event.target.value)}
                        placeholder={ui.contactSubjectPlaceholder}
                        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </label>

                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                      {ui.contactMessage}
                      <textarea
                        required
                        rows={5}
                        value={contactMessage}
                        onChange={(event) => setContactMessage(event.target.value)}
                        placeholder={ui.contactMessagePlaceholder}
                        className="mt-1.5 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </label>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {ui.confidentialityNote}
                    </p>
                    <button
                      type="submit"
                      className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      {ui.submitMessage}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-3 dark:border-slate-800 sm:px-6">
          <a
            href={buildAppPath(activePage.path)}
            className="text-xs font-semibold text-indigo-700 hover:underline dark:text-indigo-300 sm:hidden"
          >
            {ui.openFullPage}
          </a>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            {ui.closeModal}
          </button>
        </footer>
      </section>
    </div>
  );
};
