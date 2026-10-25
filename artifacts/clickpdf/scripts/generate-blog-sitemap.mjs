import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readActiveToolRegistry } from './static-tool-registry.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, '..');
const sitemapPath = path.join(appDir, 'public', 'sitemap.xml');
const llmsPath = path.join(appDir, 'public', 'llms.txt');
const blogDir = path.join(appDir, 'src', 'blogs');
const watermarkMapPath = path.join(appDir, 'src', 'data', 'blogWatermarkMap.json');
const legalPagesPath = path.join(appDir, 'src', 'data', 'legalPages.json');
const baseUrl = 'https://www.clickpdf.net';
const defaultCoverImage = 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80';
const blogWatermarkMap = JSON.parse(await readFile(watermarkMapPath, 'utf8'));
const legalPages = JSON.parse(await readFile(legalPagesPath, 'utf8'));

function getArticlePath(meta) {
  const candidate = typeof meta.routepath === 'string' ? meta.routepath.trim() : '';
  if (
    candidate.startsWith('/') &&
    !candidate.startsWith('//') &&
    !/[?#]/.test(candidate) &&
    !candidate.split('/').some((segment) => segment === '..' || segment === '.')
  ) {
    return `/${candidate.split('/').filter(Boolean).join('/')}/`;
  }
  return `/blog/${encodeURIComponent(meta.slug)}/`;
}

function normalizePageUrl(value) {
  const url = new URL(value);
  if (url.hostname === 'www.clickpdf.net' && url.pathname !== '/' && !url.pathname.endsWith('/')) {
    url.pathname += '/';
  }
  return url.toString();
}

function readFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  return Object.fromEntries(
    match[1].split(/\r?\n/).flatMap((line) => {
      const separator = line.indexOf(':');
      if (separator <= 0) return [];
      const key = line.slice(0, separator).trim().toLowerCase().replace(/[\s_-]+/g, '');
      let value = line.slice(separator + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) value = value.slice(1, -1);
      return [[key, value]];
    }),
  );
}

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function xmlDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
}

function plainText(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function markdownLabel(value = '') {
  return plainText(value).replace(/([\\[\]])/g, '\\$1');
}

const markdownFiles = (await readdir(blogDir)).filter((name) => name.endsWith('.md'));
const articles = [];
for (const fileName of markdownFiles) {
  const raw = await readFile(path.join(blogDir, fileName), 'utf8');
  const meta = readFrontmatter(raw);
  if (!meta.slug || !meta.title) continue;
  const articlePath = getArticlePath(meta);
  const coverSource = meta.coverimage || meta.image || defaultCoverImage;
  articles.push({
    ...meta,
    coverimage: blogWatermarkMap[coverSource] || coverSource,
    locale: meta.locale || 'en',
    slug: meta.slug,
    url: `${baseUrl}${articlePath}`,
  });
}

const activeTools = await readActiveToolRegistry(appDir);
const llms = [
  '# ClickPDF',
  '',
  '> A browser-based PDF toolkit by Click Digital Services.',
  '',
  '## Overview',
  '',
  'ClickPDF provides tools for merging, splitting, compressing, converting, organizing, editing, and protecting PDF documents. PDF file processing is performed in the browser for supported tools; the website may still load page resources and enabled third-party services. Device and browser limits apply.',
  '',
  '## PDF tools',
  '',
  ...activeTools.map((tool) =>
    `- [${markdownLabel(tool.name)}](${baseUrl}/tools/${encodeURIComponent(tool.slug)}/): ${plainText(tool.description)}`,
  ),
  '',
  '## Guides and articles',
  '',
  ...articles.map((article) =>
    `- [${markdownLabel(article.title)}](${article.url}): ${plainText(article.summary || article.seodescription || article.excerpt || article.title)}`,
  ),
  '',
  '## Other pages',
  '',
  `- [Frequently asked questions](${baseUrl}/faq/)`,
  `- [Batch processing queue](${baseUrl}/batch/)`,
  `- [All guides](${baseUrl}/blog/)`,
  ...legalPages.map((page) => `- [${markdownLabel(page.heading)}](${baseUrl}${page.path})`),
  `- [XML sitemap](${baseUrl}/sitemap.xml)`,
  '',
].join('\n');
await writeFile(llmsPath, llms, 'utf8');

const groups = new Map();
for (const article of articles) {
  if (!article.translationgroup) continue;
  const group = groups.get(article.translationgroup) || [];
  group.push(article);
  groups.set(article.translationgroup, group);
}

const alternateLinks = new Map();
for (const group of groups.values()) {
  const links = group.map(({ locale, url }) => ({ locale, url }));
  for (const article of group) alternateLinks.set(article.slug, links);
}

const blogUrlBlocks = articles.map((article) => {
  const lastmod = xmlDate(article.date);
  const image = article.coverimage ? new URL(article.coverimage, baseUrl).toString() : '';
  const imageXml = image
    ? `\n    <image:image>\n      <image:loc>${escapeXml(image)}</image:loc>\n      <image:title>${escapeXml(article.title)}</image:title>\n    </image:image>`
    : '';
  const alternates = alternateLinks.get(article.slug) || [];
  const alternateXml = alternates.map(({ locale, url }) =>
    `\n    <xhtml:link rel="alternate" hreflang="${escapeXml(locale)}" href="${escapeXml(url)}" />`,
  ).join('');
  const defaultUrl = alternates.find(({ locale }) => locale === 'en')?.url;
  const defaultXml = defaultUrl
    ? `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(defaultUrl)}" />`
    : '';

  return `  <url>\n    <loc>${escapeXml(article.url)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>${imageXml}${alternateXml}${defaultXml}\n  </url>`;
});

const toolUrlBlocks = activeTools.map((tool) => {
  const route = `/tools/${encodeURIComponent(tool.slug)}/`;
  return `  <url>\n    <loc>${escapeXml(`${baseUrl}${route}`)}</loc>\n    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
});

const utilityPageBlocks = [
  {
    path: '/faq/',
    title: 'Frequently Asked Questions | ClickPDF',
    description: 'Answers about ClickPDF privacy, browser processing, PDF tools, limits and compatibility.',
    priority: '0.5',
  },
  {
    path: '/batch/',
    title: 'Batch Processing Queue | ClickPDF',
    description: 'Process multiple documents sequentially in your browser and download results individually or as a ZIP.',
    priority: '0.6',
  },
  ...legalPages.map((page) => ({
    path: page.path,
    title: page.title,
    description: page.description,
    priority: '0.5',
  })),
].map(({ path: route, priority }) =>
  `  <url>\n    <loc>${escapeXml(`${baseUrl}${route}`)}</loc>\n    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
);

let sitemap = await readFile(sitemapPath, 'utf8');
sitemap = sitemap.replaceAll('https://clickpdf.net', baseUrl);
sitemap = sitemap.replace(/<loc>(https:\/\/www\.clickpdf\.net\/[^<]*)<\/loc>/g, (_match, url) => `<loc>${normalizePageUrl(url)}</loc>`);
sitemap = sitemap.replace(/(<xhtml:link\b[^>]*\bhref=")(https:\/\/www\.clickpdf\.net\/[^"]+)(")/g, (_match, prefix, url, suffix) => `${prefix}${normalizePageUrl(url)}${suffix}`);
sitemap = sitemap.replace(/\s+xmlns:xhtml="[^"]*"/, '');
sitemap = sitemap.replace(
  /<urlset\b/,
  '<urlset xmlns:xhtml="http://www.w3.org/1999/xhtml"',
);

const urlBlocks = sitemap.match(/  <url>[\s\S]*?<\/url>/g) || [];
const generatedArticleLocs = new Set(articles.map((article) => escapeXml(article.url)));
let retainedBlocks = urlBlocks.filter((block) => {
  const loc = block.match(/<loc>(.*?)<\/loc>/)?.[1] || '';
  return !/\/tools\/[^<]+/.test(loc) &&
    !/\?tool=/.test(loc) &&
    !/\/blog\/[^<]+/.test(loc) &&
    !generatedArticleLocs.has(loc) &&
    !/\/(?:faq|batch|privacy-policy|terms-of-service|about|contact|cookies|disclaimer)\/?<\/loc>/.test(block);
});

const homeIndex = retainedBlocks.findIndex((block) =>
  /<loc>https:\/\/www\.clickpdf\.net\/<\/loc>/.test(block),
);
retainedBlocks.splice(homeIndex >= 0 ? homeIndex + 1 : 0, 0, ...toolUrlBlocks, ...utilityPageBlocks);

const blogIndexIndex = retainedBlocks.findIndex((block) =>
  /<loc>https:\/\/www\.clickpdf\.net\/blog\/?<\/loc>/.test(block),
);
retainedBlocks.splice(blogIndexIndex >= 0 ? blogIndexIndex + 1 : retainedBlocks.length, 0, ...blogUrlBlocks);

const preservedHeader = sitemap.slice(0, sitemap.indexOf('  <url>'));
const preservedFooter = sitemap.slice(sitemap.lastIndexOf('</urlset>'));
const countComment = `<!-- Generated sitemap: ${retainedBlocks.length} URLs, including ${toolUrlBlocks.length} public tools, ${articles.length} Markdown blog posts and localized alternates. -->\n`;
const namespaceSafeHeader = preservedHeader
  .replace(/<!--\s*Total URLs:[\s\S]*?-->\s*/i, '')
  .replace(/<!--[\s\S]*?-->\s*$/, '');
sitemap = `${namespaceSafeHeader}${countComment}${retainedBlocks.join('\n')}\n${preservedFooter}`;

await writeFile(sitemapPath, sitemap, 'utf8');
console.log(
  `Generated sitemap routes for ${toolUrlBlocks.length} public tools, ${articles.length} Markdown articles, FAQ, batch queue, and ${legalPages.length} legal pages.`,
);
