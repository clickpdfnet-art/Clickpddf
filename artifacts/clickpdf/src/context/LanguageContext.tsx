import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Language,
  translations,
  TranslationDict,
  TOOL_TRANSLATIONS,
  SUPPORTED_LANGUAGES,
  LanguageOption
} from '../i18n/translations';
import { PDFTool } from '../types';
import { PDF_TOOLS } from '../data/toolsData';
import {
  UI_TRANSLATIONS,
  WORKSPACE_TRANSLATIONS,
  TOOL_BADGE_KEYS,
} from '../i18n/uiTranslations';
import { MISSING_TOOL_TRANSLATIONS, NewToolId } from '../i18n/missingToolTranslations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: TranslationDict;
  isRTL: boolean;
  currentLanguageOption: LanguageOption;
  ui: typeof UI_TRANSLATIONS[Language];
  getToolTitle: (tool: PDFTool | string) => string;
  getToolDescription: (tool: PDFTool | string) => string;
  getToolExtendedDescription: (tool: PDFTool | string) => string;
  getToolBadge: (tool: PDFTool | string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANG_STORAGE_KEY = 'clickpdf_lang_pref';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LANG_STORAGE_KEY) as Language;
        if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
          return saved;
        }
      } catch {}
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LANG_STORAGE_KEY, lang);
      } catch {}
    }
  };

  const toggleLanguage = () => {
    const currentIndex = SUPPORTED_LANGUAGES.findIndex(l => l.code === language);
    const nextIndex = (currentIndex + 1) % SUPPORTED_LANGUAGES.length;
    setLanguage(SUPPORTED_LANGUAGES[nextIndex].code);
  };

  const currentOption = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];
  const isRTL = currentOption.dir === 'rtl';

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [language, isRTL]);

  const t: TranslationDict = {
    ...(translations[language] || translations.en),
    ...WORKSPACE_TRANSLATIONS[language],
  };
  const ui = UI_TRANSLATIONS[language];

  const getToolTitle = (tool: PDFTool | string): string => {
    const id = typeof tool === 'string' ? tool : tool.id;
    const localized = TOOL_TRANSLATIONS[id]?.[language];
    if (localized?.title) return localized.title;
    const addedToolTranslation = MISSING_TOOL_TRANSLATIONS[language][id as NewToolId];
    if (addedToolTranslation?.title) return addedToolTranslation.title;
    if (typeof tool !== 'string') return tool.title;
    const found = PDF_TOOLS.find(t => t.id === id);
    return found?.title || id;
  };

  const getToolDescription = (tool: PDFTool | string): string => {
    const id = typeof tool === 'string' ? tool : tool.id;
    const localized = TOOL_TRANSLATIONS[id]?.[language];
    if (localized?.description) return localized.description;
    const addedToolTranslation = MISSING_TOOL_TRANSLATIONS[language][id as NewToolId];
    if (addedToolTranslation?.description) return addedToolTranslation.description;
    if (typeof tool !== 'string') return tool.description;
    const found = PDF_TOOLS.find(t => t.id === id);
    return found?.description || '';
  };

  const getToolExtendedDescription = (tool: PDFTool | string): string => {
    if (typeof tool !== 'string' && tool.extendedDescription) {
      return tool.extendedDescription;
    }
    return getToolDescription(tool);
  };

  const getToolBadge = (tool: PDFTool | string): string => {
    const badge = typeof tool === 'string' ? PDF_TOOLS.find(item => item.id === tool)?.badge : tool.badge;
    const key = badge ? TOOL_BADGE_KEYS[badge] : undefined;
    return key ? ui[key] : badge || '';
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        isRTL,
        currentLanguageOption: currentOption,
        ui,
        getToolTitle,
        getToolDescription,
        getToolExtendedDescription,
        getToolBadge,
      }}
    >
      <div dir={isRTL ? 'rtl' : 'ltr'} className={isRTL ? 'font-sans' : ''}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
