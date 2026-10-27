import { SUPPORTED_LANGUAGES, type Language } from './translations';

const supportedCodes = new Set(SUPPORTED_LANGUAGES.map(({ code }) => code));
const languageAliases: Record<string, Language> = {
  fil: 'tl',
  nb: 'no',
  nn: 'no',
};

export function detectBrowserLanguage(preferredLocales: readonly string[] = []): Language {
  for (const rawLocale of preferredLocales) {
    const normalizedLocale = rawLocale.trim().replace(/_/g, '-').toLowerCase();
    const languageCode = normalizedLocale.split('-')[0];
    if (!languageCode) continue;

    const candidate = languageAliases[languageCode] || languageCode;
    if (supportedCodes.has(candidate as Language)) return candidate as Language;
  }

  return 'en';
}

export function resolveInitialLanguage(
  savedLanguage: string | null | undefined,
  preferredLocales: readonly string[] = [],
): Language {
  if (savedLanguage && supportedCodes.has(savedLanguage as Language)) {
    return savedLanguage as Language;
  }

  return detectBrowserLanguage(preferredLocales);
}
