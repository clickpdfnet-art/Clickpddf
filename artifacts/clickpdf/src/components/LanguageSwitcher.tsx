import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SUPPORTED_LANGUAGES, Language } from '../i18n/translations';

interface LanguageSwitcherProps {
  variant?: 'header' | 'drawer';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { language, setLanguage, currentLanguageOption, ui } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
  };

  if (variant === 'drawer') {
    return (
      <div className={`space-y-1.5 ${className}`}>
        <label className="text-[10px] uppercase font-bold text-slate-400 block px-1">
          {ui.selectLanguage}
        </label>
        <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto custom-scrollbar p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = lang.code === language;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelect(lang.code)}
                className={`flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <span>{lang.flag}</span>
                  <span className="truncate">{lang.nativeName}</span>
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={ui.selectLanguage}
        className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 text-xs text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-all cursor-pointer"
      >
        <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        <span className="hidden sm:inline font-medium flex items-center gap-1">
          <span>{currentLanguageOption.flag}</span>
          <span>{currentLanguageOption.nativeName}</span>
        </span>
        <span className="sm:hidden font-medium flex items-center gap-1">
          <span>{currentLanguageOption.flag}</span>
          <span className="uppercase text-[11px]">{currentLanguageOption.code}</span>
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Language selection dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 custom-scrollbar">
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>{ui.languageMenuTitle}</span>
            <span className="text-[9px] text-indigo-500 font-semibold lowercase">{ui.languageCount}</span>
          </div>
          <div className="p-1 space-y-0.5">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-base shrink-0">{lang.flag}</span>
                    <div className="flex flex-col truncate">
                      <span className="truncate font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                        {lang.nativeName}
                        {lang.nativeName.toLowerCase() !== lang.name.toLowerCase() && (
                          <span className="text-[10px] font-normal text-slate-400 ml-1">· {lang.name}</span>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                        {lang.country}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 ml-1.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
