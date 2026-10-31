import type { Language } from '../i18n/translations';
import localizedContentSource from '../i18n/toolSeoContentTranslations.json';
import { TOOL_PAGE_CONTENT, type ToolPageContent } from './toolPageContent';

export interface ToolPageSeoLabels {
  home: string;
  quickAnswer: string;
  howTo: string;
  faq: string;
  relatedTools: string;
  browseTools: string;
  privacy: string;
}

interface LocalizedToolContent {
  introHeading?: string;
  intro?: string;
  stepsHeading: string;
  steps: Array<{ title: string; description: string }>;
  faqs: Array<{ question: string; answer: string }>;
}

interface LocalizedToolLocale {
  labels: ToolPageSeoLabels;
  tools: Record<string, LocalizedToolContent>;
}

const localizedToolContent = localizedContentSource as Partial<Record<Language, LocalizedToolLocale>>;

export function getLocalizedToolPageSeoContent(
  toolId: string,
  language: Language,
): ToolPageContent | undefined {
  if (language === 'en') return TOOL_PAGE_CONTENT[toolId];

  const translated = localizedToolContent[language]?.tools[toolId];
  if (!translated) return undefined;

  return {
    introHeading: translated.introHeading,
    intro: translated.intro,
    stepsHeading: translated.stepsHeading,
    steps: translated.steps.map((step, index) => ({
      step: index + 1,
      title: step.title,
      description: step.description,
    })),
    faqs: translated.faqs,
  };
}

export function getToolPageSeoLabels(language: Language): ToolPageSeoLabels | undefined {
  return localizedToolContent[language]?.labels;
}

export function getToolPageSeoLanguages(toolId: string): Language[] {
  const locales = Object.entries(localizedToolContent)
    .filter(([, content]) => Boolean(content?.tools[toolId]))
    .map(([language]) => language as Language);
  return ['en', ...locales.filter((language) => language !== 'en')];
}

export function hasLocalizedToolPageSeoContent(toolId: string, language: Language): boolean {
  return language === 'en' || Boolean(localizedToolContent[language]?.tools[toolId]);
}
