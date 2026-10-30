import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readActiveToolRegistry } from './static-tool-registry.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, '..');
const sitemapPath = path.join(appDir, 'public', 'sitemap.xml');
const llmsPath = path.join(appDir, 'public', 'llms.txt');
const llmsFullPath = path.join(appDir, 'public', 'llms-full.txt');
const blogDir = path.join(appDir, 'src', 'blogs');
const watermarkMapPath = path.join(appDir, 'src', 'data', 'blogWatermarkMap.json');
const legalPagesPath = path.join(appDir, 'src', 'data', 'legalPages.json');
const toolSeoTranslationsPath = path.join(appDir, 'src', 'i18n', 'toolSeoContentTranslations.json');
const baseUrl = 'https://www.clickpdf.net';
const defaultCoverImage = 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80';
const blogWatermarkMap = JSON.parse(await readFile(watermarkMapPath, 'utf8'));
const legalPages = JSON.parse(await readFile(legalPagesPath, 'utf8'));
const toolSeoTranslations = JSON.parse(await readFile(toolSeoTranslationsPath, 'utf8'));

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

const documentProcessingPrivacyNote =
  "For supported PDF tools, document file contents are processed locally in your browser on your device rather than uploaded to ClickPDF's document-processing service. This describes document processing only: the website may still make standard network requests for its code, fonts, workers, images, and other page resources. Enabled advertising or other third-party features may also make standard requests and receive associated connection metadata under their own policies. This is not a claim of zero network traffic or anonymity. Processing capacity depends on the tool, browser, device memory, and file size.";

function accuratePrivacyCopy(value = '') {
  return plainText(value)
    .replace(/\bwith\s+(?:zero|no)\s+(?:server|cloud)\s+uploads?\b/gi,
      'with document content processed locally in the browser')
    .replace(/\b(?:zero|no)\s+(?:server|cloud)\s+uploads?\b/gi,
      'local processing of document content in the browser')
    .replace(/\b100%\s+client-side\s+privacy\b/gi, 'local processing of document content in the browser')
    .replace(/\b(?:100%|complete|total|guaranteed)\s+privacy\b/gi, 'local processing of document content in the browser')
    .replace(/\b100%\s+private\b/gi, 'processed locally in the browser')
    .replace(/\b100%\s+in-browser\s+security\b/gi, 'browser-side document processing')
    .replace(/\bmilitary-grade\b/gi, 'AES-256');
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
  `ClickPDF provides ${activeTools.length} browser-based tools for merging, splitting, compressing, converting, organizing, editing, and protecting PDF documents. ${documentProcessingPrivacyNote}`,
  '',
  '## PDF tools',
  '',
  ...activeTools.map((tool) =>
    `- [${markdownLabel(tool.name)}](${baseUrl}/tools/${encodeURIComponent(tool.slug)}/): ${accuratePrivacyCopy(tool.description)}`,
  ),
  '',
  '## Guides and articles',
  '',
  ...articles.map((article) =>
    `- [${markdownLabel(article.title)}](${article.url}): ${accuratePrivacyCopy(article.summary || article.seodescription || article.excerpt || article.title)}`,
  ),
  '',
  '## Other pages',
  '',
  `- [Frequently asked questions](${baseUrl}/faq/)`,
  `- [Batch processing queue](${baseUrl}/batch/)`,
  `- [All guides](${baseUrl}/blog/)`,
  ...legalPages.map((page) => `- [${markdownLabel(page.heading)}](${baseUrl}${page.path}): ${accuratePrivacyCopy(page.description)}`),
  '',
  '## Machine-readable indexes',
  '',
  `- [Canonical homepage](${baseUrl}/)`,
  `- [XML sitemap](${baseUrl}/sitemap.xml)`,
  `- [Full site guide for language models](${baseUrl}/llms-full.txt)`,
  '',
].join('\n');
await writeFile(llmsPath, llms, 'utf8');

const llmsFull = [
  '# ClickPDF — Full Site Guide',
  '',
  `Canonical homepage: ${baseUrl}/`,
  'Publisher: Click Digital Services',
  `Public PDF tools: ${activeTools.length}`,
  `Published Markdown articles: ${articles.length}`,
  '',
  '## Overview',
  '',
  'ClickPDF is a browser-based suite of PDF utilities. The tools cover document organization, optimization, conversion, text extraction, metadata, signatures, and protection. The tool list below is generated from the active public tool registry; hidden tools are excluded.',
  '',
  '## Document processing and network requests',
  '',
  documentProcessingPrivacyNote,
  '',
  'PDF operations may use significant browser memory and processing time, especially for large or image-heavy files. Results and supported features vary by tool, PDF structure, browser, device, and available memory. Scanned documents may require OCR; extraction quality depends on the scan and available OCR resources.',
  '',
  '## PDF tools',
  '',
  ...activeTools.flatMap((tool) => {
    const route = `${baseUrl}/tools/${encodeURIComponent(tool.slug)}/`;
    const features = [...new Set((tool.benefits || []).map((benefit) =>
      accuratePrivacyCopy(benefit.title || ''),
    ).filter(Boolean))];
    const steps = (tool.steps || []).map((step) => accuratePrivacyCopy(
      typeof step === 'string' ? step : [step?.title, step?.description].filter(Boolean).join(': '),
    ));
    const questions = (tool.faqs || []).map((faq) => accuratePrivacyCopy(faq.question || '')).filter(Boolean);
    return [
      `### ${markdownLabel(tool.name)}`,
      `URL: ${route}`,
      `Description: ${accuratePrivacyCopy(tool.description)}`,
      ...(features.length ? [`Key capabilities: ${features.join('; ')}`] : []),
      ...(steps.length ? [`Typical workflow: ${steps.join(' → ')}`] : []),
      ...(questions.length ? [`Common questions: ${questions.join(' | ')}`] : []),
      '',
    ];
  }),
  '## Guides and articles',
  '',
  ...articles.map((article) =>
    `- [${markdownLabel(article.title)}](${article.url}): ${accuratePrivacyCopy(article.summary || article.seodescription || article.excerpt || article.title)}`,
  ),
  '',
  '## Other public pages',
  '',
  `- [Home](${baseUrl}/)`,
  `- [PDF tools catalog](${baseUrl}/tools/)`,
  `- [Frequently asked questions](${baseUrl}/faq/)`,
  `- [Batch processing queue](${baseUrl}/batch/)`,
  `- [Blog and guides](${baseUrl}/blog/)`,
  ...legalPages.map((page) =>
    `- [${markdownLabel(page.heading)}](${baseUrl}${page.path}): ${accuratePrivacyCopy(page.description)}`,
  ),
  '',
  '## Machine-readable indexes',
  '',
  `- Canonical homepage: ${baseUrl}/`,
  `- XML sitemap: ${baseUrl}/sitemap.xml`,
  `- Short LLM index: ${baseUrl}/llms.txt`,
  `- Full LLM guide: ${baseUrl}/llms-full.txt`,
  `- Robots policy: ${baseUrl}/robots.txt`,
  '',
].join('\n');
await writeFile(llmsFullPath, llmsFull, 'utf8');

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

const toolUrlBlocks = activeTools.flatMap((tool) => {
  const englishUrl = `${baseUrl}/tools/${encodeURIComponent(tool.slug)}/`;
  const localizedLocales = Object.entries(toolSeoTranslations)
    .filter(([locale, localeData]) => Boolean(localeData?.tools?.[tool.id] && tool.localizedTitles?.[locale]))
    .map(([locale]) => locale);
  const alternateUrls = [
    { locale: 'en', url: englishUrl },
    ...localizedLocales.map((locale) => ({
      locale,
      url: `${baseUrl}/${locale}/tools/${encodeURIComponent(tool.slug)}/`,
    })),
  ];
  const alternates = [
    ...alternateUrls,
    { locale: 'x-default', url: englishUrl },
  ].map(({ locale, url }) =>
    `    <xhtml:link rel="alternate" hreflang="${escapeXml(locale)}" href="${escapeXml(url)}" />`,
  ).join('\n');
  return alternateUrls.map(({ url }) =>
    `  <url>\n    <loc>${escapeXml(url)}</loc>\n    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n${alternates}\n  </url>`,
  );
});

const utilityPageBlocks = [
  {
    path: '/tools/',
    title: 'All PDF Tools for Documents | ClickPDF',
    description: 'Browse ClickPDF’s PDF tools for merging, splitting, compressing, converting, editing, organizing, and securing documents in your browser. Choose a tool.',
    priority: '0.7',
  },
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
    !/<loc>https:\/\/www\.clickpdf\.net\/tools\/<\/loc>/.test(block) &&
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
