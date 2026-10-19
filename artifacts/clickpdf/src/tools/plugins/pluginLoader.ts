import React from 'react';
import { PDFTool } from '../../types';
import type { ToolSeoInfo } from '../../data/toolSeoData';
import { ToolPlugin } from './types';

/**
 * Auto-Discovered Plugin Registry
 * Uses Vite's import.meta.glob to scan all *.tsx files in src/tools/plugins/
 * Any new file added to src/tools/plugins/ is discovered at build/dev time with zero code edits.
 */
export function loadAllPlugins(): ToolPlugin[] {
  const plugins: ToolPlugin[] = [];

  try {
    // Eagerly scan all .tsx files inside /src/tools/plugins/
    const pluginModules = import.meta.glob('/src/tools/plugins/*.tsx', {
      eager: true,
    }) as Record<string, unknown>;

    for (const [path, rawModule] of Object.entries(pluginModules)) {
      // Exclude template, types, or private files starting with underscore or dot
      const fileName = path.split('/').pop() || '';
      if (
        fileName.startsWith('_') ||
        fileName.startsWith('.') ||
        fileName.endsWith('.example') ||
        fileName === 'types.tsx' ||
        fileName === 'types.ts'
      ) {
        continue;
      }

      const mod = rawModule as { default?: ToolPlugin; plugin?: ToolPlugin } | ToolPlugin;
      const candidate = (mod && typeof mod === 'object' && 'default' in mod && mod.default)
        ? mod.default
        : (mod && typeof mod === 'object' && 'plugin' in mod && mod.plugin)
        ? mod.plugin
        : (mod as ToolPlugin);

      // Validate required properties of ToolPlugin interface
      if (
        candidate &&
        typeof candidate === 'object' &&
        typeof candidate.id === 'string' &&
        typeof candidate.slug === 'string' &&
        typeof candidate.title === 'string' &&
        typeof candidate.shortDescription === 'string' &&
        typeof candidate.category === 'string' &&
        typeof candidate.iconName === 'string' &&
        candidate.seo &&
        Array.isArray(candidate.seo.howToSteps) &&
        Array.isArray(candidate.seo.faqs) &&
        candidate.Component
      ) {
        plugins.push(candidate);
      }
    }
  } catch (err) {
    console.warn('ClickPDF Plugin Auto-Discovery error:', err);
  }

  return plugins;
}

// Cached plugins instance to avoid re-running glob on every call
let cachedPlugins: ToolPlugin[] | null = null;

export function getDiscoveredPlugins(): ToolPlugin[] {
  if (!cachedPlugins) {
    cachedPlugins = loadAllPlugins();
  }
  return cachedPlugins;
}

/**
 * Transforms all auto-discovered plugins into standard PDFTool objects
 * for display in the Home Page grid, search, and navigation.
 */
export function getPluginToolsAsPdfTools(): PDFTool[] {
  const plugins = getDiscoveredPlugins();
  return plugins.map((plugin) => ({
    id: plugin.id,
    title: plugin.title,
    description: plugin.shortDescription,
    extendedDescription: plugin.extendedDescription || plugin.seo.metaDescription || plugin.shortDescription,
    category: plugin.category,
    iconName: plugin.iconName,
    badge: plugin.badge || 'Plugin',
    accentColor: plugin.accentColor || 'from-teal-600 to-indigo-600',
    acceptedFileTypes: plugin.acceptedFileTypes || '.pdf,application/pdf',
    multiFile: plugin.multiFile !== undefined ? plugin.multiFile : true,
    isPlugin: true
  }));
}

/**
 * Generates compliant ToolSeoInfo metadata for all plugin tools
 * so they automatically receive:
 * - Dynamic <title>, <meta name="description">, canonical tag
 * - WebApplication, HowTo, and FAQPage Schema.org JSON-LD structured data
 * - Accordion FAQs and 1-2-3 How-To steps on the tool landing page
 */
export function getPluginSeoInfo(toolIdOrSlug: string): ToolSeoInfo | undefined {
  if (!toolIdOrSlug) return undefined;
  const normalized = toolIdOrSlug.toLowerCase().trim();
  const plugins = getDiscoveredPlugins();

  const found = plugins.find(
    (p) =>
      p.id.toLowerCase() === normalized ||
      p.slug.toLowerCase() === normalized ||
      p.id.toLowerCase().replace(/^(?:tools|tool)\//, '') === normalized ||
      p.slug.toLowerCase().replace(/^(?:tools|tool)\//, '') === normalized
  );

  if (!found) return undefined;

  const seo = found.seo;

  return {
    slug: found.slug,
    toolId: found.id,
    aliases: [found.slug, found.id, `${found.slug}-online`, `${found.id}-pdf`],
    h1Title: seo.h1Title || `${found.title} Online Free — 100% In-Browser`,
    metaTitle: seo.metaTitle || `${found.title} Online Free – Client-Side PDF Tool | ClickPDF`,
    metaDescription: seo.metaDescription || found.shortDescription,
    keywords: seo.keywords || `${found.title.toLowerCase()}, pdf tool, client-side, zero server uploads, in browser`,
    targetKeywords: [found.title.toLowerCase(), found.slug],
    badge: found.badge || 'Client-Side Tool',
    overviewHeading: seo.overviewHeading || `Why Use ${found.title} in Your Browser?`,
    overview: seo.overview || seo.metaDescription || found.shortDescription,
    secondaryOverview: seo.secondaryOverview || found.extendedDescription || found.shortDescription,
    privacyHighlight: 'Private by Design: All files are processed locally in your browser memory and never uploaded to any server.',
    stepsHeading: seo.stepsHeading || `How to Use ${found.title} in 3 Simple Steps`,
    steps: seo.howToSteps.map((s, idx) => ({
      step: s.step || idx + 1,
      title: s.title,
      description: s.description
    })),
    faqs: seo.faqs.map((f) => ({
      question: f.question,
      answer: f.answer
    })),
    benefits: (seo.benefits && seo.benefits.length > 0)
      ? seo.benefits.map((b) => ({
          title: b.title,
          desc: b.desc,
          iconName: b.iconName || 'ShieldCheck'
        }))
      : [
          { title: '100% Private Sandbox', desc: 'Processes locally inside your browser memory with zero cloud transfer.', iconName: 'ShieldCheck' },
          { title: 'No File Size Limits', desc: 'No arbitrary upload timeouts or server queue bottlenecks.', iconName: 'Zap' },
          { title: 'Instant Local Output', desc: 'Download your processed document immediately with no waiting.', iconName: 'Sparkles' }
        ],
    relatedToolIds: seo.relatedToolIds || ['merge', 'split', 'compress', 'watermark']
  };
}

/**
 * Retrieves the specific plugin instance for rendering in ToolWorkspace
 */
export function getToolPlugin(toolIdOrSlug: string): ToolPlugin | undefined {
  if (!toolIdOrSlug) return undefined;
  const normalized = toolIdOrSlug.toLowerCase().trim();
  const plugins = getDiscoveredPlugins();

  return plugins.find(
    (p) =>
      p.id.toLowerCase() === normalized ||
      p.slug.toLowerCase() === normalized ||
      p.id.toLowerCase().replace(/^(?:tools|tool)\//, '') === normalized ||
      p.slug.toLowerCase().replace(/^(?:tools|tool)\//, '') === normalized
  );
}
