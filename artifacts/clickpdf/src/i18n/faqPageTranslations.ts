import faqPageTranslations from './faqPageTranslations.json';
import type { Language } from './translations';
import type { FaqItem } from '../types';

export type FaqPageCopy = typeof faqPageTranslations.en.ui;
type LocalizedFaqItem = Pick<FaqItem, 'question' | 'answer' | 'categoryLabel' | 'highlights'>;

interface FaqLocaleData {
  ui: FaqPageCopy;
  items: Record<string, LocalizedFaqItem>;
}

export const FAQ_PAGE_TRANSLATIONS = faqPageTranslations as Record<Language, FaqLocaleData>;

export function getLocalizedFaqItem(item: FaqItem, language: Language): FaqItem {
  const localized = FAQ_PAGE_TRANSLATIONS[language].items[item.id];
  return localized ? { ...item, ...localized } : item;
}
