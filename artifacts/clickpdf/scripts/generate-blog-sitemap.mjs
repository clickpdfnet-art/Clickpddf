import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, '..');
const sitemapPath = path.join(appDir, 'public', 'sitemap.xml');
const blogDir = path.join(appDir, 'src', 'blogs');
const baseUrl = 'https://www.clickpdf.net';

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
  return `/blog/${encodeURIComponent(meta.slug)}`;
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

const markdownFiles = (await readdir(blogDir)).filter((name) => name.endsWith('.md'));
const articles = [];
for (const fileName of markdownFiles) {
  const raw = await readFile(path.join(blogDir, fileName), 'utf8');
  const meta = readFrontmatter(raw);
  if (!meta.slug || !meta.title) continue;
  const articlePath = getArticlePath(meta);
  articles.push({
    ...meta,
    locale: meta.locale || 'en',
    slug: meta.slug,
    url: `${baseUrl}${articlePath}`,
  });
}

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

let sitemap = await readFile(sitemapPath, 'utf8');
sitemap = sitemap.replaceAll('https://clickpdf.net', baseUrl);
sitemap = sitemap.replace(/\s+xmlns:xhtml="[^"]*"/, '');
sitemap = sitemap.replace(
  /<urlset\b/,
  '<urlset xmlns:xhtml="http://www.w3.org/1999/xhtml"',
);

const urlBlocks = sitemap.match(/  <url>[\s\S]*?<\/url>/g) || [];
const generatedArticleLocs = new Set(articles.map((article) => escapeXml(article.url)));
const retainedBlocks = urlBlocks.filter((block) => {
  const loc = block.match(/<loc>(.*?)<\/loc>/)?.[1] || '';
  return !/\/blog\/[^<]+/.test(loc) && !generatedArticleLocs.has(loc);
});
const blogIndexIndex = retainedBlocks.findIndex((block) =>
  /<loc>https:\/\/clickpdf\.net\/blog\/?<\/loc>/.test(block),
);
retainedBlocks.splice(blogIndexIndex >= 0 ? blogIndexIndex + 1 : retainedBlocks.length, 0, ...blogUrlBlocks);

const preservedHeader = sitemap.slice(0, sitemap.indexOf('  <url>'));
const preservedFooter = sitemap.slice(sitemap.lastIndexOf('</urlset>'));
const countComment = `<!-- Generated sitemap: ${retainedBlocks.length} URLs, including ${articles.length} Markdown blog posts and localized alternates. -->\n`;
const namespaceSafeHeader = preservedHeader
  .replace(/<!--\s*Total URLs:[\s\S]*?-->\s*/i, '')
  .replace(/<!--[\s\S]*?-->\s*$/, '');
sitemap = `${namespaceSafeHeader}${countComment}${retainedBlocks.join('\n')}\n${preservedFooter}`;

await writeFile(sitemapPath, sitemap, 'utf8');
console.log(`Generated sitemap blog URLs for ${articles.length} Markdown articles.`);
