import { PDFTool, BlogPost } from '../types';
import { PUBLIC_PDF_TOOLS } from '../data/toolsData';
import { INITIAL_ARTICLES, getStoredArticles } from '../data/initialArticles';
import { getToolSeoInfo } from '../data/toolSeoData';

export interface SitemapEntry {
  loc: string;
  path: string;
  title: string;
  category: 'core' | 'tool' | 'blog-index' | 'blog-post';
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
  description?: string;
  badge?: string;
  image?: string;
}

export interface SitemapOptions {
  baseUrl?: string;
  tools?: PDFTool[];
  articles?: BlogPost[];
  includeImages?: boolean;
}

/**
 * Normalizes base URL to ensure no trailing slash.
 */
export function normalizeBaseUrl(url?: string): string {
  if (url && url.trim().length > 0) {
    return url.trim().replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }
  return 'https://clickpdf.net';
}

/**
 * Escapes characters for safe XML inclusion.
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Formats a date into ISO standard YYYY-MM-DD.
 */
export function formatIsoDate(dateInput?: Date | string): string {
  try {
    if (!dateInput) return new Date().toISOString().split('T')[0];
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
    return d.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Returns structured metadata for all indexed URLs (Homepage, public PDF tools, blog hub, all articles).
 */
export function getSitemapEntries(options?: SitemapOptions): SitemapEntry[] {
  const baseUrl = normalizeBaseUrl(options?.baseUrl);
  const tools = options?.tools ?? PUBLIC_PDF_TOOLS;
  const articles = options?.articles || (typeof window !== 'undefined' ? getStoredArticles() : INITIAL_ARTICLES);
  const today = formatIsoDate();

  const entries: SitemapEntry[] = [];

  // 1. Root / Homepage
  entries.push({
    loc: `${baseUrl}/`,
    path: '/',
    title: 'ClickPDF — Home & All Tools',
    category: 'core',
    lastmod: today,
    changefreq: 'daily',
    priority: '1.0',
    description: 'Fast, private in-browser PDF utilities suite with zero server uploads.',
    badge: 'Core'
  });

  // 2. Public PDF tools (dynamic iteration over the visible catalog)
  tools.forEach((tool) => {
    const isHighPriority = ['merge', 'split', 'compress', 'rotate', 'organize', 'jpg-to-pdf'].includes(tool.id);
    const seo = getToolSeoInfo(tool.id);
    const toolPath = seo ? `/tools/${seo.slug}` : `/?tool=${encodeURIComponent(tool.id)}`;
    const pageTitle = seo ? seo.metaTitle : `${tool.title} — Online PDF Tool`;
    const pageDesc = seo ? seo.metaDescription : tool.description;

    entries.push({
      loc: `${baseUrl}${toolPath}`,
      path: toolPath,
      title: pageTitle,
      category: 'tool',
      lastmod: today,
      changefreq: 'weekly',
      priority: isHighPriority ? '0.9' : '0.8',
      description: pageDesc,
      badge: tool.badge || tool.category
    });
  });

  // 3. Blog Hub / Educational Guides index
  entries.push({
    loc: `${baseUrl}/blog`,
    path: '/blog',
    title: 'ClickPDF Knowledge Base & Privacy Guides',
    category: 'blog-index',
    lastmod: today,
    changefreq: 'daily',
    priority: '0.8',
    description: 'Practical guides and deep-dives on PDF manipulation, privacy architecture, and document management.',
    badge: 'Blog'
  });

  // 4. All Blog Posts (dynamically pulled from folder-based markdown posts or active storage)
  articles.forEach((article) => {
    const articleDate = formatIsoDate(article.date);
    entries.push({
      loc: `${baseUrl}/blog/${encodeURIComponent(article.slug)}`,
      path: `/blog/${article.slug}`,
      title: article.title,
      category: 'blog-post',
      lastmod: articleDate || today,
      changefreq: 'monthly',
      priority: '0.7',
      description: article.excerpt,
      badge: article.category,
      image: article.coverImage
    });
  });

  return entries;
}

/**
 * Generates dynamic standard XML sitemap compliant with sitemaps.org Schema 0.9.
 */
export function generateSitemapXml(options?: SitemapOptions): string {
  const entries = getSitemapEntries(options);
  const tools = options?.tools ?? PUBLIC_PDF_TOOLS;
  const includeImages = options?.includeImages ?? true;

  const xmlUrls = entries.map((entry) => {
    let urlXml = `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>\n    <lastmod>${entry.lastmod}</lastmod>\n    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>`;

    if (includeImages && entry.image) {
      urlXml += `\n    <image:image>\n      <image:loc>${escapeXml(entry.image)}</image:loc>\n      <image:title>${escapeXml(entry.title)}</image:title>\n    </image:image>`;
    }

    urlXml += `\n  </url>`;
    return urlXml;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
<!-- Generated dynamically by ClickPDF XML Sitemap Generator -->
<!-- Total URLs: ${entries.length} (1 Core + ${tools.length} PDF Tools + 1 Blog Hub + ${entries.filter(e => e.category === 'blog-post').length} Articles) -->
${xmlUrls.join('\n')}
</urlset>`;
}

/**
 * Generates standard robots.txt content referencing the dynamic sitemap.
 */
export function generateRobotsTxt(baseUrl?: string): string {
  const normalized = normalizeBaseUrl(baseUrl);
  return `# ClickPDF Robots.txt - In-Browser Privacy Utilities
User-agent: *
Allow: /
Allow: /?tool=*
Allow: /?view=blog
Allow: /?article=*

# Dynamic XML Sitemap
Sitemap: ${normalized}/sitemap.xml
`;
}

/**
 * Triggers a browser download of the XML sitemap.
 */
export function downloadSitemapXmlFile(options?: SitemapOptions, filename = 'sitemap.xml'): void {
  const xml = generateSitemapXml(options);
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
