import installModalTranslations from './installModalTranslations.json';
import type { Language } from './translations';

export type InstallModalCopy = typeof installModalTranslations.en;

export const INSTALL_MODAL_TRANSLATIONS = installModalTranslations as Record<
  Language,
  InstallModalCopy
>;
