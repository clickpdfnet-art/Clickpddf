export type ToolCategory = 
  | 'all' 
  | 'organize' 
  | 'optimize' 
  | 'convert' 
  | 'edit' 
  | 'security';

export interface PDFTool {
  id: string;
  title: string;
  description: string;
  extendedDescription?: string;
  category: ToolCategory;
  iconName: string;
  badge?: string;
  accentColor: string;
  acceptedFileTypes: string; // e.g. ".pdf" or ".pdf,image/*"
  multiFile?: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  coverImage?: string;
  targetTool?: string;
  targetToolUrl?: string;
  targetToolTitle?: string;
  targetToolCta?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'security' | 'technology' | 'compliance' | 'performance' | 'features';
  categoryLabel: string;
  highlights?: string[];
}

export interface SeoMetaConfig {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  keywords: string;
  canonicalUrl: string;
  twitterCard: 'summary' | 'summary_large_image';
}

