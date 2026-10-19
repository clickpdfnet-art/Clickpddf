import React from 'react';
import { ToolCategory } from '../../types';

export interface PluginHowToStep {
  step: number;
  title: string;
  description: string;
}

export interface PluginFaq {
  question: string;
  answer: string;
}

export interface PluginBenefit {
  title: string;
  desc: string;
  iconName?: string;
}

export interface PluginSeoConfig {
  metaTitle: string;
  metaDescription: string;
  h1Title?: string;
  keywords?: string;
  overviewHeading?: string;
  overview?: string;
  secondaryOverview?: string;
  stepsHeading?: string;
  howToSteps: PluginHowToStep[];
  faqs: PluginFaq[];
  benefits?: PluginBenefit[];
  relatedToolIds?: string[];
}

export interface ToolPluginProps {
  onBack?: () => void;
  onSwitchTool?: (toolId: string) => void;
  initialFiles?: File[];
}

/**
 * Standard ToolPlugin Interface
 * Any new .tsx file placed inside src/tools/plugins/ must export an object
 * adhering to this interface (as default export or named export `plugin`).
 */
export interface ToolPlugin {
  id: string; // Unique tool identifier, e.g. "extract-tables"
  slug: string; // Clean URL slug, e.g. "extract-tables" -> /tools/extract-tables
  title: string; // Tool display name, e.g. "Extract PDF Tables"
  shortDescription: string; // Summary shown on the Home Page card
  extendedDescription?: string; // Optional detailed description
  category: ToolCategory; // 'organize' | 'optimize' | 'convert' | 'edit' | 'security'
  iconName: string; // Lucide icon name, e.g. 'Table', 'FileSpreadsheet', 'Sparkles', 'Layers'
  badge?: string; // Optional badge, e.g. 'New', 'Plugin', 'Popular'
  accentColor?: string; // Optional Tailwind gradient, e.g. 'from-teal-500 to-cyan-600'
  acceptedFileTypes?: string; // Accepted MIME types / extensions, defaults to '.pdf,application/pdf'
  multiFile?: boolean; // Whether the tool handles multiple files
  seo: PluginSeoConfig; // Complete SEO metadata, How-To steps, FAQs & structured data
  Component: React.ComponentType<ToolPluginProps>; // The 100% in-browser React component
}
