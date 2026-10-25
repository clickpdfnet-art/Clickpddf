import legalPageData from './legalPages.json';

export type LegalPageId =
  | 'about'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'cookies'
  | 'disclaimer';

export type LegalPageSchemaType = 'WebPage' | 'AboutPage' | 'ContactPage';

export interface LegalPageSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalPageDefinition {
  id: LegalPageId;
  path: string;
  title: string;
  heading: string;
  description: string;
  schemaType: LegalPageSchemaType;
  contactEmail?: string;
  sections: LegalPageSection[];
}

export const LEGAL_PAGES = legalPageData as LegalPageDefinition[];

export function getLegalPageById(id: LegalPageId): LegalPageDefinition | undefined {
  return LEGAL_PAGES.find((page) => page.id === id);
}

export function getLegalPageByPath(pathname: string): LegalPageDefinition | undefined {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  return LEGAL_PAGES.find((page) => (page.path.replace(/\/+$/, '') || '/') === normalizedPath);
}
