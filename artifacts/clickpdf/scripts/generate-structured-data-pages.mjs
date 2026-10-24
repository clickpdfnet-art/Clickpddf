import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, '..');
const outputDir = path.join(appDir, 'dist', 'public');
const sitemapPath = path.join(outputDir, 'sitemap.xml');
const toolSeoPath = path.join(appDir, 'src', 'data', 'toolSeoData.ts');
const blogDir = path.join(appDir, 'src', 'blogs');
const siteOrigin = 'https://clickpdf.net';
const pageSchemaId = 'clickpdf-page-schema';

function decodeXml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function escapeJsonForHtml(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
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
      ) {
        value = value.slice(1, -1);
      }
      return [[key, value]];
    }),
  );
}

function readStaticToolSeoRegistry(sourceText) {
  const source = ts.createSourceFile(
    toolSeoPath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const declaration = source.statements
    .filter(ts.isVariableStatement)
    .flatMap((statement) => [...statement.declarationList.declarations])
    .find((item) => ts.isIdentifier(item.name) && item.name.text === 'TOOL_SEO_REGISTRY');
  const initializer = declaration?.initializer;
  if (!initializer || !ts.isObjectLiteralExpression(initializer)) {
    throw new Error('Could not read TOOL_SEO_REGISTRY from toolSeoData.ts');
  }

  const getStringProperty = (object, propertyName) => {
    const property = object.properties.find((item) => {
      if (!ts.isPropertyAssignment(item)) return false;
      const name = item.name;
      return (ts.isIdentifier(name) || ts.isStringLiteral(name)) && name.text === propertyName;
    });
    if (!property || !ts.isPropertyAssignment(property)) return '';
    const value = property.initializer;
    return ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)
      ? value.text
      : '';
  };

  const registry = new Map();
  for (const entry of initializer.properties) {
    if (!ts.isPropertyAssignment(entry) || !ts.isObjectLiteralExpression(entry.initializer)) continue;
    const info = entry.initializer;
    const slug = getStringProperty(info, 'slug');
    if (!slug) continue;
    registry.set(slug, {
      name: getStringProperty(info, 'h1Title') || getStringProperty(info, 'metaTitle') || slug,
      title: getStringProperty(info, 'metaTitle') || getStringProperty(info, 'h1Title') || slug,
      description: getStringProperty(info, 'metaDescription'),
    });
  }
  return registry;
}

function toIsoDate(value) {
  const fullDate =
    /^\d{4}-\d{2}-\d{2}$/.test(value) ||
    /^[A-Za-z]+\s+\d{1,2},\s+\d{4}$/.test(value);
  if (!value || !fullDate) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function makeSoftwareApplicationSchema({ name, description, url }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${url}#software`,
    name,
    url,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    creator: { '@id': `${siteOrigin}/#organization` },
    publisher: { '@id': `${siteOrigin}/#organization` },
  };
}

function makeBlogPostingSchema(article, url) {
  const published = toIsoDate(article.date);
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#blogposting`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    headline: article.title,
    ...(article.seotitle && article.seotitle !== article.title
      ? { alternativeHeadline: article.seotitle }
      : {}),
    description: article.seodescription || article.summary || article.excerpt || article.title,
    inLanguage: article.locale || 'en',
    ...(article.seokeywords ? { keywords: article.seokeywords } : {}),
    ...(article.coverimage
      ? { image: [new URL(article.coverimage, siteOrigin).toString()] }
      : { image: [`${siteOrigin}/icon.svg`] }),
    ...(published ? { datePublished: published } : {}),
    author: {
      '@type': 'Organization',
      name: article.author || 'ClickPDF Editorial Team',
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${siteOrigin}/#organization`,
      name: 'Click Digital Services',
      url: siteOrigin,
      logo: {
        '@type': 'ImageObject',
        url: `${siteOrigin}/icon.svg`,
      },
    },
  };
}

function setMeta(html, selector, content) {
  if (!content) return html;
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const pattern = new RegExp(`(<meta\\b[^>]*${selector}[^>]*content=["'])[^"']*(["'][^>]*>)`, 'i');
  if (pattern.test(html)) return html.replace(pattern, (_match, prefix, suffix) => `${prefix}${escaped}${suffix}`);
  const tag = `<meta ${selector} content="${escaped}" />`;
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function prepareRouteHtml(template, { url, title, description, schema, ogType = 'website' }) {
  const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let html = template.replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`);
  html = html.replace(
    new RegExp(`<script\\b(?=[^>]*\\bid=["']clickpdf-home-faq-schema["'])[^>]*>[\\s\\S]*?<\\/script>`, 'i'),
    '',
  );
  html = setMeta(html, 'name="description"', description);
  html = setMeta(html, 'property="og:title"', title);
  html = setMeta(html, 'property="og:description"', description);
  html = setMeta(html, 'property="og:url"', url);
  html = setMeta(html, 'property="og:type"', ogType);

  const canonicalPattern = /<link\b[^>]*rel=["']canonical["'][^>]*>/i;
  const canonical = `<link rel="canonical" href="${url}" />`;
  html = canonicalPattern.test(html)
    ? html.replace(canonicalPattern, canonical)
    : html.replace('</head>', `    ${canonical}\n  </head>`);

  const schemaScript = `<script id="${pageSchemaId}" type="application/ld+json">${escapeJsonForHtml(schema)}</script>`;
  const existingSchemaPattern = new RegExp(
    `<script\\b(?=[^>]*\\bid=["']${pageSchemaId}["'])[^>]*>[\\s\\S]*?<\\/script>`,
    'i',
  );
  if (existingSchemaPattern.test(html)) {
    html = html.replace(existingSchemaPattern, schemaScript);
  } else {
    html = html.replace('</head>', `    ${schemaScript}\n  </head>`);
  }
  return html;
}

const template = await readFile(path.join(outputDir, 'index.html'), 'utf8');
const sitemap = await readFile(sitemapPath, 'utf8');
const toolSeoRegistry = readStaticToolSeoRegistry(await readFile(toolSeoPath, 'utf8'));
const generated = [];

for (const rawLoc of sitemap.matchAll(/<loc>([\s\S]*?)<\/loc>/g)) {
  const absoluteUrl = decodeXml(rawLoc[1].trim());
  const url = new URL(absoluteUrl);
  const match = url.pathname.match(/^\/tools\/([^/]+)\/?$/);
  if (!match) continue;

  const slug = decodeURIComponent(match[1]);
  const tool = toolSeoRegistry.get(slug);
  const name = tool?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  const title = tool?.title || name;
  const description = tool?.description || `Use the free ${name} PDF utility in your web browser.`;
  const schema = makeSoftwareApplicationSchema({ name, description, url: absoluteUrl });
  const relativePath = path.join('tools', slug, 'index.html');
  const outputPath = path.join(outputDir, relativePath);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    prepareRouteHtml(template, { url: absoluteUrl, title, description, schema }),
    'utf8',
  );
  generated.push(relativePath);
}

const blogFiles = await readdir(blogDir);
for (const fileName of blogFiles.filter((name) => name.endsWith('.md'))) {
  const article = readFrontmatter(await readFile(path.join(blogDir, fileName), 'utf8'));
  if (!article.slug || !article.title) continue;
  const url = `${siteOrigin}/blog/${encodeURIComponent(article.slug)}`;
  const description = article.seodescription || article.summary || article.excerpt || article.title;
  const schema = makeBlogPostingSchema(article, url);
  const relativePath = path.join('blog', article.slug, 'index.html');
  const outputPath = path.join(outputDir, relativePath);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    prepareRouteHtml(template, {
      url,
      title: article.seotitle || article.title,
      description,
      schema,
      ogType: 'article',
    }),
    'utf8',
  );
  generated.push(relativePath);
}

console.log(`Generated route-specific HTML head schemas for ${generated.length} tool and blog pages.`);
