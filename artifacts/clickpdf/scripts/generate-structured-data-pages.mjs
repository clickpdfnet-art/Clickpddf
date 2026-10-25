import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readActiveToolRegistry, readTypeScriptExport } from './static-tool-registry.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, '..');
const outputDir = path.join(appDir, 'dist', 'public');
const sitemapPath = path.join(outputDir, 'sitemap.xml');
const faqDataPath = path.join(appDir, 'src', 'data', 'faqData.ts');
const blogDir = path.join(appDir, 'src', 'blogs');
const siteOrigin = 'https://www.clickpdf.net';
const pageSchemaId = 'clickpdf-page-schema';
const homeSiteSchemaId = 'clickpdf-home-site-schema';
const homeFaqSchemaId = 'clickpdf-home-faq-schema';

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

function decodeXml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function toIsoDate(value) {
  const fullDate =
    /^\d{4}-\d{2}-\d{2}$/.test(value) ||
    /^[A-Za-z]+\s+\d{1,2},\s+\d{4}$/.test(value);
  if (!value || !fullDate) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function parseJsonArray(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function articlePath(article) {
  const candidate = typeof article.routepath === 'string' ? article.routepath.trim() : '';
  if (
    candidate.startsWith('/') &&
    !candidate.startsWith('//') &&
    !/[?#]/.test(candidate) &&
    !candidate.split('/').some((segment) => segment === '..' || segment === '.')
  ) {
    return `/${candidate.split('/').filter(Boolean).join('/')}/`;
  }
  return `/blog/${encodeURIComponent(article.slug)}/`;
}

function absoluteSiteUrl(value) {
  const url = new URL(value, siteOrigin);
  if (['clickpdf.net', 'www.clickpdf.net'].includes(url.hostname.toLowerCase())) {
    url.hostname = 'www.clickpdf.net';
    url.protocol = 'https:';
  }
  if (url.hostname === 'www.clickpdf.net' && url.pathname !== '/' && !url.pathname.endsWith('/')) {
    url.pathname += '/';
  }
  return url.toString();
}

function makeBreadcrumbListSchema(url, crumbs) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteSiteUrl(crumb.url),
    })),
  };
}

function makeFaqPageSchema(faqItems, url) {
  if (!faqItems.length) return undefined;
  return {
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

function makeToolSchema({ tool, name, title, description, url }) {
  if (!tool?.steps?.length || !tool?.faqs?.length) {
    throw new Error(`Tool ${url} is missing visible HowTo steps or FAQ content in toolSeoData.ts`);
  }
  const breadcrumb = makeBreadcrumbListSchema(url, [
    { name: 'Home', url: `${siteOrigin}/` },
    { name, url },
  ]);
  const software = {
    '@type': ['SoftwareApplication', 'WebApplication'],
    '@id': `${url}#software`,
    name,
    url,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    description,
    inLanguage: 'en',
    creator: { '@id': `${siteOrigin}/#organization` },
    publisher: { '@id': `${siteOrigin}/#organization` },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    ...(tool.benefits?.length
      ? { featureList: tool.benefits.map((benefit) => `${benefit.title}: ${benefit.desc}`) }
      : {}),
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };
  const howTo = {
    '@type': 'HowTo',
    '@id': `${url}#howto`,
    name: tool.stepsHeading || `How to use ${name}`,
    description: `Steps for using ${name} in the ClickPDF browser application.`,
    inLanguage: 'en',
    step: tool.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: Number(step.step) || index + 1,
      name: step.title,
      text: step.description,
    })),
  };
  const faq = makeFaqPageSchema(tool.faqs, url);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: title,
        description,
        inLanguage: 'en',
        isPartOf: { '@id': `${siteOrigin}/#website` },
        breadcrumb: { '@id': breadcrumb['@id'] },
        mainEntity: { '@id': software['@id'] },
      },
      software,
      howTo,
      faq,
      breadcrumb,
    ],
  };
}

function makeBlogSchema(article, url) {
  const description = article.seodescription || article.summary || article.excerpt || article.title;
  const published = toIsoDate(article.date);
  const modified = toIsoDate(article.datemodified || article.modified || article.updated);
  const customBreadcrumbs = parseJsonArray(article.breadcrumbs).filter(
    (item) => item && typeof item.name === 'string' && typeof item.url === 'string',
  );
  const breadcrumbs = customBreadcrumbs.length
    ? customBreadcrumbs
    : [
        { name: 'Home', url: `${siteOrigin}/` },
        { name: 'Blog', url: `${siteOrigin}/blog/` },
        { name: article.title, url },
      ];
  const breadcrumb = makeBreadcrumbListSchema(url, breadcrumbs);
  const posting = {
    '@type': ['BlogPosting', 'Article'],
    '@id': `${url}#blogposting`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${url}#webpage` },
    url,
    headline: article.title,
    ...(article.seotitle && article.seotitle !== article.title
      ? { alternativeHeadline: article.seotitle }
      : {}),
    description,
    inLanguage: article.locale || 'en',
    ...(article.seokeywords ? { keywords: article.seokeywords } : {}),
    ...(article.category ? { articleSection: article.category } : {}),
    image: article.coverimage
      ? [new URL(article.coverimage, siteOrigin).toString()]
      : [`${siteOrigin}/icon.svg`],
    ...(published ? { datePublished: published } : {}),
    ...(modified ? { dateModified: modified } : {}),
    author: {
      '@type': 'Organization',
      name: article.author || 'ClickPDF Editorial Team',
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${siteOrigin}/#organization`,
      name: 'Click Digital Services',
      url: siteOrigin,
      logo: { '@type': 'ImageObject', url: `${siteOrigin}/icon.svg` },
    },
  };
  const faq = makeFaqPageSchema(
    parseJsonArray(article.faqitems).filter(
      (item) => item && typeof item.question === 'string' && typeof item.answer === 'string',
    ),
    url,
  );
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: article.seotitle || article.title,
        description,
        inLanguage: article.locale || 'en',
        isPartOf: { '@id': `${siteOrigin}/#website` },
        breadcrumb: { '@id': breadcrumb['@id'] },
        mainEntity: { '@id': posting['@id'] },
      },
      posting,
      breadcrumb,
      ...(faq ? [faq] : []),
    ],
  };
}

function makeHomepageSchema(toolPages) {
  const navigation = [
    { name: 'Home', url: `${siteOrigin}/` },
    { name: 'PDF Tools', url: `${siteOrigin}/#global-search-input` },
    { name: 'FAQ', url: `${siteOrigin}/faq/` },
    { name: 'Batch Processing Queue', url: `${siteOrigin}/batch/` },
    { name: 'Blog', url: `${siteOrigin}/blog/` },
  ];
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteOrigin}/#website`,
        name: 'ClickPDF',
        alternateName: 'ClickPDF by Click Digital Services',
        url: `${siteOrigin}/`,
        publisher: { '@id': `${siteOrigin}/#organization` },
      },
      {
        '@type': 'WebPage',
        '@id': `${siteOrigin}/#webpage`,
        url: `${siteOrigin}/`,
        name: 'ClickPDF — Free In-Browser PDF Tools',
        isPartOf: { '@id': `${siteOrigin}/#website` },
        mainEntity: { '@id': `${siteOrigin}/#webapplication` },
      },
      {
        '@type': 'WebApplication',
        '@id': `${siteOrigin}/#webapplication`,
        name: 'ClickPDF',
        url: `${siteOrigin}/`,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web',
        description: 'Free browser-based PDF tools for merging, splitting, compressing, converting, editing and securing documents without uploading files to a processing server.',
        creator: { '@id': `${siteOrigin}/#organization` },
        publisher: { '@id': `${siteOrigin}/#organization` },
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        featureList: [
          'Merge and reorder PDF files',
          'Split PDF pages and extract page ranges',
          'Compress PDF documents in the browser',
          'Convert documents and images to and from PDF',
          'Edit, sign, rotate and organize PDF pages',
          'Protect documents and inspect PDF metadata',
        ],
      },
      {
        '@type': 'ItemList',
        '@id': `${siteOrigin}/#tools`,
        name: 'ClickPDF PDF tools',
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        numberOfItems: toolPages.length,
        itemListElement: toolPages.map((tool, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: tool.name,
          url: tool.url,
        })),
      },
      {
        '@type': 'SiteNavigationElement',
        '@id': `${siteOrigin}/#site-navigation`,
        name: 'ClickPDF main navigation',
        hasPart: navigation.map((item) => ({
          '@type': 'WebPage',
          name: item.name,
          url: item.url,
        })),
      },
    ],
  };
}

function makeFaqRouteSchema(faqItems, url) {
  const breadcrumb = makeBreadcrumbListSchema(url, [
    { name: 'Home', url: `${siteOrigin}/` },
    { name: 'Frequently Asked Questions', url },
  ]);
  const faq = makeFaqPageSchema(faqItems, url);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: 'Frequently Asked Questions | ClickPDF',
        description: 'Answers about ClickPDF privacy, browser processing, PDF tools, limits and compatibility.',
        isPartOf: { '@id': `${siteOrigin}/#website` },
        breadcrumb: { '@id': breadcrumb['@id'] },
        mainEntity: { '@id': faq['@id'] },
      },
      faq,
      breadcrumb,
    ],
  };
}

function makeBatchRouteSchema(url) {
  const breadcrumb = makeBreadcrumbListSchema(url, [
    { name: 'Home', url: `${siteOrigin}/` },
    { name: 'Batch Processing Queue', url },
  ]);
  const app = {
    '@type': 'WebApplication',
    '@id': `${url}#application`,
    name: 'ClickPDF Batch Processing Queue',
    url,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    description: 'Process a batch of documents in the browser using a selected transformation, then download results individually or in a ZIP file.',
    isPartOf: { '@id': `${siteOrigin}/#webapplication` },
  };
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: 'Batch Processing Queue | ClickPDF',
        description: app.description,
        isPartOf: { '@id': `${siteOrigin}/#website` },
        breadcrumb: { '@id': breadcrumb['@id'] },
        mainEntity: { '@id': app['@id'] },
      },
      app,
      breadcrumb,
    ],
  };
}

function makeBlogIndexSchema(articles, url) {
  const breadcrumb = makeBreadcrumbListSchema(url, [
    { name: 'Home', url: `${siteOrigin}/` },
    { name: 'Blog', url },
  ]);
  const itemList = {
    '@type': 'ItemList',
    '@id': `${url}#articles`,
    name: 'ClickPDF Guides and Articles',
    numberOfItems: articles.length,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    itemListElement: articles.map((article, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: article.title,
      url: absoluteSiteUrl(`${siteOrigin}${articlePath(article)}`),
    })),
  };
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${url}#webpage`,
        url,
        name: 'ClickPDF Knowledge Base & Privacy Guides',
        description: 'Practical guides about PDF tools, document privacy, and browser-based workflows.',
        isPartOf: { '@id': `${siteOrigin}/#website` },
        breadcrumb: { '@id': breadcrumb['@id'] },
        mainEntity: { '@id': itemList['@id'] },
      },
      itemList,
      breadcrumb,
    ],
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

function setJsonLdScript(html, id, schema) {
  const script = `<script id="${id}" type="application/ld+json">${escapeJsonForHtml(schema)}</script>`;
  const pattern = new RegExp(
    `<script\\b(?=[^>]*\\bid=["']${id}["'])[^>]*>[\\s\\S]*?<\\/script>`,
    'i',
  );
  return pattern.test(html) ? html.replace(pattern, script) : html.replace('</head>', `    ${script}\n  </head>`);
}

function removeJsonLdScripts(html, ids) {
  return ids.reduce((result, id) => {
    const pattern = new RegExp(
      `<script\\b(?=[^>]*\\bid=["']${id}["'])[^>]*>[\\s\\S]*?<\\/script>`,
      'gi',
    );
    return result.replace(pattern, '');
  }, html);
}

function prepareRouteHtml(template, {
  url,
  title,
  description,
  schema,
  ogType = 'website',
  socialImage,
  socialImageAlt,
  robots,
}) {
  const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let html = removeJsonLdScripts(template, [homeSiteSchemaId, homeFaqSchemaId]);
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`);
  html = setMeta(html, 'name="description"', description);
  html = setMeta(html, 'property="og:title"', title);
  html = setMeta(html, 'property="og:description"', description);
  html = setMeta(html, 'property="og:url"', url);
  html = setMeta(html, 'property="og:type"', ogType);
  if (robots) html = setMeta(html, 'name="robots"', robots);
  if (socialImage) {
    const absoluteImage = new URL(socialImage, siteOrigin).toString();
    html = setMeta(html, 'property="og:site_name"', 'ClickPDF');
    html = setMeta(html, 'property="og:image"', absoluteImage);
    html = setMeta(html, 'property="og:image:alt"', socialImageAlt || title);
    html = setMeta(html, 'name="twitter:card"', 'summary_large_image');
    html = setMeta(html, 'name="twitter:title"', title);
    html = setMeta(html, 'name="twitter:description"', description);
    html = setMeta(html, 'name="twitter:image"', absoluteImage);
    html = setMeta(html, 'name="twitter:image:alt"', socialImageAlt || title);
  }

  const canonicalPattern = /<link\b[^>]*rel=["']canonical["'][^>]*>/i;
  const canonical = `<link rel="canonical" href="${url}" />`;
  html = canonicalPattern.test(html)
    ? html.replace(canonicalPattern, canonical)
    : html.replace('</head>', `    ${canonical}\n  </head>`);

  return setJsonLdScript(html, pageSchemaId, schema);
}

const template = await readFile(path.join(outputDir, 'index.html'), 'utf8');
const sitemap = await readFile(sitemapPath, 'utf8');
const toolSeoRegistry = new Map(
  (await readActiveToolRegistry(appDir)).map((tool) => [tool.slug, tool]),
);
const faqData = await readTypeScriptExport(faqDataPath, 'FAQ_DATA');
const generated = [];
const sitemapUrls = [...sitemap.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map((match) =>
  absoluteSiteUrl(decodeXml(match[1].trim())),
);
const toolPages = [];

for (const absoluteUrl of sitemapUrls) {
  const route = new URL(absoluteUrl);
  const match = route.pathname.match(/^\/tools\/([^/]+)\/?$/);
  if (!match) continue;
  const slug = decodeURIComponent(match[1]);
  const tool = toolSeoRegistry.get(slug);
  if (!tool) throw new Error(`Public tool ${slug} has no entry in TOOL_SEO_REGISTRY`);
  const name = tool.h1Title || tool.metaTitle || slug;
  const title = tool.metaTitle || name;
  const description = tool.metaDescription || `Use ${name} in your browser with ClickPDF.`;
  const schema = makeToolSchema({ tool, name, title, description, url: absoluteUrl });
  const relativePath = path.join('tools', slug, 'index.html');
  const outputPath = path.join(outputDir, relativePath);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    prepareRouteHtml(template, { url: absoluteUrl, title, description, schema }),
    'utf8',
  );
  generated.push(relativePath);
  toolPages.push({ name, url: absoluteUrl });
}

const blogFiles = (await readdir(blogDir)).filter((name) => name.endsWith('.md')).sort();
const articles = [];
for (const fileName of blogFiles) {
  const article = readFrontmatter(await readFile(path.join(blogDir, fileName), 'utf8'));
  if (!article.slug || !article.title) continue;
  articles.push(article);
}

for (const article of articles) {
  const routePath = articlePath(article);
  const url = absoluteSiteUrl(`${siteOrigin}${routePath}`);
  const description = article.seodescription || article.summary || article.excerpt || article.title;
  const schema = makeBlogSchema(article, url);
  const relativePath = path.join(routePath.replace(/^\/|\/$/g, ''), 'index.html');
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
      socialImage: article.coverimage,
      socialImageAlt: article.imagealt,
      robots: 'index,follow',
    }),
    'utf8',
  );
  generated.push(relativePath);
}

const blogIndexUrl = `${siteOrigin}/blog/`;
const blogIndexSchema = makeBlogIndexSchema(articles, blogIndexUrl);
const blogIndexPath = path.join(outputDir, 'blog', 'index.html');
await mkdir(path.dirname(blogIndexPath), { recursive: true });
await writeFile(
  blogIndexPath,
  prepareRouteHtml(template, {
    url: blogIndexUrl,
    title: 'ClickPDF Knowledge Base & Privacy Guides',
    description: 'Practical guides about PDF tools, document privacy, and browser-based workflows.',
    schema: blogIndexSchema,
    robots: 'index,follow',
  }),
  'utf8',
);
generated.push('blog/index.html');

const faqUrl = `${siteOrigin}/faq/`;
const faqItems = Array.isArray(faqData)
  ? faqData.filter((item) => item?.question && item?.answer)
  : [];
const faqPath = path.join(outputDir, 'faq', 'index.html');
await mkdir(path.dirname(faqPath), { recursive: true });
await writeFile(
  faqPath,
  prepareRouteHtml(template, {
    url: faqUrl,
    title: 'Frequently Asked Questions | ClickPDF',
    description: 'Answers about ClickPDF privacy, browser processing, PDF tools, limits and compatibility.',
    schema: makeFaqRouteSchema(faqItems, faqUrl),
    robots: 'index,follow',
  }),
  'utf8',
);
generated.push('faq/index.html');

const batchUrl = `${siteOrigin}/batch/`;
const batchPath = path.join(outputDir, 'batch', 'index.html');
await mkdir(path.dirname(batchPath), { recursive: true });
await writeFile(
  batchPath,
  prepareRouteHtml(template, {
    url: batchUrl,
    title: 'Batch Processing Queue | ClickPDF',
    description: 'Process multiple documents sequentially in your browser and download results individually or as a ZIP.',
    schema: makeBatchRouteSchema(batchUrl),
    robots: 'index,follow',
  }),
  'utf8',
);
generated.push('batch/index.html');

const homeIndexPath = path.join(outputDir, 'index.html');
let homeHtml = removeJsonLdScripts(template, [pageSchemaId, homeFaqSchemaId]);
homeHtml = setJsonLdScript(homeHtml, homeSiteSchemaId, makeHomepageSchema(toolPages));
await writeFile(homeIndexPath, homeHtml, 'utf8');

if (!faqItems.length) throw new Error('FAQ_DATA contains no usable question and answer pairs');
console.log(
  `Generated raw-head Schema.org JSON-LD for ${toolPages.length} tools, ${articles.length} blog posts, blog index, FAQ page, batch page, and homepage.`,
);
