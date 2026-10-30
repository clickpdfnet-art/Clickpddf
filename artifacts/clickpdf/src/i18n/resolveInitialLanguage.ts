import { SUPPORTED_LANGUAGES, type Language } from './translations';

const supportedCodes = new Set(SUPPORTED_LANGUAGES.map(({ code }) => code));

export function resolveInitialLanguage(savedLanguage: string | null | undefined): Language {
  if (savedLanguage && supportedCodes.has(savedLanguage as Language)) {
    return savedLanguage as Language;
  }

  return 'en';
}
