import legalPageTranslations from './legalPageTranslations.json';
import type { Language } from './translations';
import type { LegalPageId, LegalPageSection } from '../data/legalPages';

export interface LocalizedLegalPage {
  heading: string;
  description: string;
  sections: LegalPageSection[];
}

export const LEGAL_PAGE_TRANSLATIONS = legalPageTranslations as Record<
  Language,
  Record<LegalPageId, LocalizedLegalPage>
>;

export function getLocalizedLegalPage(id: LegalPageId, language: Language): LocalizedLegalPage {
  return LEGAL_PAGE_TRANSLATIONS[language][id];
}
