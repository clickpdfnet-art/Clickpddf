export interface OcrLanguageOption {
  code: string;
  name: string;
  nativeName?: string;
}

export const SUPPORTED_OCR_LANGUAGES: OcrLanguageOption[] = [
  { code: 'eng', name: 'English', nativeName: 'English' },
  { code: 'spa', name: 'Spanish', nativeName: 'Español' },
  { code: 'fra', name: 'French', nativeName: 'Français' },
  { code: 'deu', name: 'German', nativeName: 'Deutsch' },
  { code: 'ita', name: 'Italian', nativeName: 'Italiano' },
  { code: 'por', name: 'Portuguese', nativeName: 'Português' },
  { code: 'nld', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'chi_sim', name: 'Chinese (Simplified)', nativeName: '简体中文' },
  { code: 'jpn', name: 'Japanese', nativeName: '日本語' },
  { code: 'rus', name: 'Russian', nativeName: 'Русский' },
  { code: 'ara', name: 'Arabic', nativeName: 'العربية' },
  { code: 'urd', name: 'Urdu', nativeName: 'اردو' },
  { code: 'hin', name: 'Hindi', nativeName: 'हिन्दी' },
];
