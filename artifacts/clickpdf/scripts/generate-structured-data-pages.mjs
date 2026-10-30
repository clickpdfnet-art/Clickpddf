import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { readActiveToolRegistry, readTypeScriptExport } from './static-tool-registry.mjs';
import {
  renderBatchFallback,
  renderBlogFallback,
  renderBlogIndexFallback,
  renderFaqFallback,
  renderHomeFallback,
  renderLegalPageFallback,
  renderToolFallback,
  renderToolsIndexFallback,
} from './static-page-content.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, '..');
const outputDir = path.join(appDir, 'dist', 'public');
const sitemapPath = path.join(outputDir, 'sitemap.xml');
const faqDataPath = path.join(appDir, 'src', 'data', 'faqData.ts');
const legalPagesPath = path.join(appDir, 'src', 'data', 'legalPages.json');
const blogDir = path.join(appDir, 'src', 'blogs');
const siteOrigin = 'https://www.clickpdf.net';
const socialImage = `${siteOrigin}/social/clickpdf-social-1200x630.png`;
const logoUrl = `${siteOrigin}/icon-512.png`;
const blogWatermarkMap = JSON.parse(
  await readFile(path.join(appDir, 'src', 'data', 'blogWatermarkMap.json'), 'utf8'),
);
const legalPages = JSON.parse(await readFile(legalPagesPath, 'utf8'));
const defaultBlogCover = 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80';
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

function brandLogoImage() {
  return {
    '@type': 'ImageObject',
    url: logoUrl,
    contentUrl: logoUrl,
    width: 512,
    height: 512,
  };
}

function makeFaqPageSchema(faqItems, url, id = `${url}#faq`, language = 'en') {
  if (!faqItems.length) return undefined;
  return {
    '@type': 'FAQPage',
    '@id': id,
    inLanguage: language,
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

function makeToolSchema({ tool, name, title, description, url, language = 'en', homeLabel = 'Home' }) {
  if (!tool?.steps?.length || !tool?.faqs?.length) {
    throw new Error(`Tool ${url} is missing visible HowTo steps or FAQ content in toolSeoData.ts`);
  }
  const breadcrumb = makeBreadcrumbListSchema(url, [
    { name: homeLabel, url: `${siteOrigin}/` },
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
    inLanguage: language,
    creator: { '@id': `${siteOrigin}/#organization` },
    publisher: { '@id': `${siteOrigin}/#organization` },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    ...(language === 'en' && tool.benefits?.length
      ? { featureList: tool.benefits.map((benefit) => `${benefit.title}: ${benefit.desc}`) }
      : {}),
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };
  const howTo = {
    '@type': 'HowTo',
    '@id': `${url}#howto`,
    name: tool.stepsHeading || `How to use ${name}`,
    description: language === 'en'
      ? `Steps for using ${name} in the ClickPDF browser application.`
      : tool.stepsHeading,
    inLanguage: language,
    step: tool.steps.map((step, index) => {
      const stepName = typeof step === 'string'
        ? step
        : step?.title || step?.name || `Step ${index + 1}`;
      const stepText = typeof step === 'string'
        ? step
        : step?.description || step?.text || stepName;
      return {
        '@type': 'HowToStep',
        position: Number(step?.step) || index + 1,
        name: stepName,
        text: stepText,
      };
    }),
  };
  const faq = makeFaqPageSchema(tool.faqs, url, `${url}#faq`, language);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: title,
        description,
        inLanguage: language,
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
    author: article.authortype === 'Person'
      ? {
          '@type': 'Person',
          name: article.authorname || article.author?.split(',')[0].trim() || 'ClickPDF Author',
          ...(article.authorjobtitle
            ? { jobTitle: article.authorjobtitle }
            : article.author?.includes(',')
              ? { jobTitle: article.author.split(',').slice(1).join(',').trim() }
              : {}),
        }
      : {
          '@type': 'Organization',
          name: article.author || 'ClickPDF Editorial Team',
        },
    publisher: {
      '@type': 'Organization',
      '@id': `${siteOrigin}/#organization`,
      name: 'Click Digital Services',
      url: siteOrigin,
      logo: brandLogoImage(),
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

function makeHomepageSchema(toolPages, faqItems) {
  const navigation = [
    { name: 'Home', url: `${siteOrigin}/` },
    { name: 'PDF Tools', url: `${siteOrigin}/#global-search-input` },
    { name: 'FAQ', url: `${siteOrigin}/faq/` },
    { name: 'Batch Processing Queue', url: `${siteOrigin}/batch/` },
    { name: 'Blog', url: `${siteOrigin}/blog/` },
  ];
  const homeFaq = makeFaqPageSchema(faqItems, `${siteOrigin}/`, `${siteOrigin}/#faq`);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteOrigin}/#website`,
        name: 'ClickPDF',
        alternateName: 'ClickPDF by Click Digital Services',
        url: `${siteOrigin}/`,
        image: brandLogoImage(),
        publisher: { '@id': `${siteOrigin}/#organization` },
      },
      {
        '@type': 'WebPage',
        '@id': `${siteOrigin}/#webpage`,
        url: `${siteOrigin}/`,
        name: 'ClickPDF — Free In-Browser PDF Tools',
        isPartOf: { '@id': `${siteOrigin}/#website` },
        mainEntity: { '@id': `${siteOrigin}/#webapplication` },
        ...(homeFaq ? { hasPart: { '@id': homeFaq['@id'] } } : {}),
      },
      {
        '@type': 'WebApplication',
        '@id': `${siteOrigin}/#webapplication`,
        name: 'ClickPDF',
        url: `${siteOrigin}/`,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web',
        description: 'Free browser-based PDF tools. Supported document files are processed locally in your browser; the page may also make standard requests for resources and enabled third-party services, including advertising.',
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
      ...(homeFaq ? [homeFaq] : []),
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
        description: 'Find answers about browser-based PDF processing, privacy and third-party network requests, tool capabilities, file limits, compatibility, and downloads.',
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
    description: 'Process several documents sequentially in your browser, apply a selected tool to each file, and download results individually or together as a ZIP file.',
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

function makeLegalPageSchema(page, url) {
  const breadcrumb = makeBreadcrumbListSchema(url, [
    { name: 'Home', url: `${siteOrigin}/` },
    { name: page.heading, url },
  ]);
  const mainEntity = page.id === 'about'
    ? { '@id': `${siteOrigin}/#organization` }
    : page.id === 'contact' && page.contactEmail
      ? {
          '@type': 'ContactPoint',
          contactType: 'Customer Support',
          email: page.contactEmail,
        }
      : undefined;
  const pageSchema = {
    '@type': page.schemaType,
    '@id': `${url}#webpage`,
    url,
    name: page.heading,
    description: page.description,
    inLanguage: 'en',
    isPartOf: { '@id': `${siteOrigin}/#website` },
    ...(mainEntity ? { mainEntity } : {}),
    breadcrumb: { '@id': breadcrumb['@id'] },
  };
  return {
    '@context': 'https://schema.org',
    '@graph': [pageSchema, breadcrumb],
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
        description: 'Explore ClickPDF guides on browser-based PDF tools, privacy, document processing, file formats, compression, everyday workflows, and troubleshooting.',
        isPartOf: { '@id': `${siteOrigin}/#website` },
        breadcrumb: { '@id': breadcrumb['@id'] },
        mainEntity: { '@id': itemList['@id'] },
      },
      itemList,
      breadcrumb,
    ],
  };
}

function makeToolsIndexSchema(tools, url) {
  const breadcrumb = makeBreadcrumbListSchema(url, [
    { name: 'Home', url: `${siteOrigin}/` },
    { name: 'All PDF Tools', url },
  ]);
  const itemListId = `${url}#tools`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${url}#webpage`,
        url,
        name: 'All PDF Tools for Documents | ClickPDF',
        description: 'Browse ClickPDF’s PDF tools for merging, splitting, compressing, converting, editing, organizing, and securing documents in your browser. Choose a tool.',
        isPartOf: { '@id': `${siteOrigin}/#website` },
        breadcrumb: { '@id': breadcrumb['@id'] },
        mainEntity: { '@id': itemListId },
      },
      {
        '@type': 'ItemList',
        '@id': itemListId,
        name: 'ClickPDF PDF tools',
        numberOfItems: tools.length,
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        itemListElement: tools.map((tool, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: tool.name,
          url: `${siteOrigin}/tools/${encodeURIComponent(tool.slug)}/`,
        })),
      },
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
  const pattern = new RegExp(`(<meta\\b[^>]*${selector}[^>]*content=)(["'])([\\s\\S]*?)\\2([^>]*>)`, 'i');
  if (pattern.test(html)) {
    return html.replace(pattern, (_match, prefix, quote, _current, suffix) =>
      `${prefix}${quote}${escaped}${quote}${suffix}`,
    );
  }
  const tag = `<meta ${selector} content="${escaped}" />`;
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function metadataLength(value) {
  return Array.from(String(value || '')).length;
}

function setHtmlLanguage(html, language) {
  const safeLanguage = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(language || '')
    ? language
    : 'en';
  return html.replace(/<html\b([^>]*)>/i, (_match, attributes) => {
    const withLanguage = /\blang\s*=/i.test(attributes)
      ? attributes.replace(/\blang\s*=\s*(["'])[^"']*\1/i, `lang="${safeLanguage}"`)
      : `${attributes} lang="${safeLanguage}"`;
    return `<html${withLanguage}>`;
  });
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
  keywords = '',
  schema,
  schemaId = pageSchemaId,
  staticContent = '',
  ogType = 'website',
  socialImage: pageSocialImage = socialImage,
  socialImageWidth = 1200,
  socialImageHeight = 630,
  socialImageAlt = 'ClickPDF gold shield logo with a red PDF page and lightning bolt beside PDF tools',
  hreflangAlternates = [],
  hreflangIdPrefix = 'clickpdf-blog-hreflang',
  robots,
  lang = 'en',
}) {
  const titleLength = metadataLength(title);
  const descriptionLength = metadataLength(description);
  if (lang === 'en' && (titleLength < 30 || titleLength > 60)) {
    throw new Error(`Title length for ${url} must be 30–60 characters; received ${titleLength}.`);
  }
  if (lang === 'en' && (descriptionLength < 120 || descriptionLength > 158)) {
    throw new Error(`Description length for ${url} must be 120–158 characters; received ${descriptionLength}.`);
  }
  if (lang !== 'en' && (!titleLength || !descriptionLength || titleLength > 80 || descriptionLength > 220)) {
    throw new Error(`Localized metadata for ${url} must be present and reasonably sized.`);
  }
  const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let html = setHtmlLanguage(
    removeJsonLdScripts(template, [homeSiteSchemaId, homeFaqSchemaId]),
    lang,
  );
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`);
  html = setMeta(html, 'name="description"', description);
  if (keywords) html = setMeta(html, 'name="keywords"', keywords);
  html = setMeta(html, 'property="og:title"', title);
  html = setMeta(html, 'property="og:description"', description);
  html = setMeta(html, 'property="og:url"', url);
  html = setMeta(html, 'property="og:type"', ogType);
  if (robots) html = setMeta(html, 'name="robots"', robots);
  const absoluteImage = new URL(pageSocialImage, siteOrigin).toString();
  html = setMeta(html, 'property="og:site_name"', 'ClickPDF');
  html = setMeta(html, 'property="og:image"', absoluteImage);
  html = setMeta(html, 'property="og:image:alt"', socialImageAlt || title);
  html = setMeta(html, 'property="og:image:width"', String(socialImageWidth));
  html = setMeta(html, 'property="og:image:height"', String(socialImageHeight));
  html = setMeta(html, 'name="twitter:card"', 'summary_large_image');
  html = setMeta(html, 'name="twitter:title"', title);
  html = setMeta(html, 'name="twitter:description"', description);
  html = setMeta(html, 'name="twitter:image"', absoluteImage);
  html = setMeta(html, 'name="twitter:image:alt"', socialImageAlt || title);

  const canonicalPattern = /<link\b[^>]*rel=["']canonical["'][^>]*>/i;
  const canonical = `<link rel="canonical" href="${url}" />`;
  html = canonicalPattern.test(html)
    ? html.replace(canonicalPattern, canonical)
    : html.replace('</head>', `    ${canonical}\n  </head>`);

  if (hreflangAlternates.length) {
    const alternateLinks = hreflangAlternates.map(({ locale, url: alternateUrl }) => {
      const safeLocale = String(locale).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
      const safeUrl = String(alternateUrl).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
      return `    <link rel="alternate" hreflang="${safeLocale}" href="${safeUrl}" id="${hreflangIdPrefix}-${safeLocale}" />`;
    }).join('\n');
    html = html.replace('</head>', `${alternateLinks}\n  </head>`);
  }

  html = setJsonLdScript(html, schemaId, schema);
  if (staticContent) {
    html = html.replace('</body>', `${staticContent}\n  </body>`);
  }
  return html;
}

const template = await readFile(path.join(outputDir, 'index.html'), 'utf8');
const sitemap = await readFile(sitemapPath, 'utf8');
const activeTools = await readActiveToolRegistry(appDir);
const toolSeoRegistry = new Map(activeTools.map((tool) => [tool.slug, tool]));
const faqData = await readTypeScriptExport(faqDataPath, 'FAQ_DATA');
const generated = [];
const sitemapUrls = [...sitemap.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map((match) =>
  absoluteSiteUrl(decodeXml(match[1].trim())),
);
const toolPages = [];

for (const absoluteUrl of sitemapUrls) {
  const route = new URL(absoluteUrl);
  const localizedMatch = route.pathname.match(/^\/([a-z]{2})\/tools\/([^/]+)\/?$/);
  const englishMatch = route.pathname.match(/^\/tools\/([^/]+)\/?$/);
  const match = localizedMatch || englishMatch;
  if (!match) continue;
  const language = localizedMatch ? localizedMatch[1] : 'en';
  const slug = decodeURIComponent(localizedMatch ? localizedMatch[2] : englishMatch[1]);
  const tool = toolSeoRegistry.get(slug);
  if (!tool) throw new Error(`Public tool ${slug} has no entry in TOOL_SEO_REGISTRY`);
  const translation = language === 'en' ? undefined : tool.localizedSeoContent?.[language];
  const localizedTitle = language === 'en' ? undefined : tool.localizedTitles?.[language];
  if (language !== 'en' && (!translation || !localizedTitle)) {
    throw new Error(`Localized tool page ${absoluteUrl} is missing complete SEO content or tool labels.`);
  }
  const contentTool = translation
    ? {
        ...tool,
        name: localizedTitle.title,
        title: `${localizedTitle.title} | ClickPDF`,
        description: localizedTitle.description,
        shortDescription: localizedTitle.description,
        privacySummary: tool.privacySummaries?.[language] || '',
        stepsHeading: translation.content.stepsHeading,
        steps: translation.content.steps,
        faqs: translation.content.faqs,
      }
    : tool;
  const name = contentTool.name || slug;
  const title = contentTool.title || name;
  const description = contentTool.description || `Use ${name} in your browser with ClickPDF.`;
  const schema = makeToolSchema({
    tool: contentTool,
    name,
    title,
    description,
    url: absoluteUrl,
    language,
    homeLabel: translation?.labels?.home || 'Home',
  });
  const relativePath = path.join(...(language === 'en' ? [] : [language]), 'tools', slug, 'index.html');
  const outputPath = path.join(outputDir, relativePath);
  await mkdir(path.dirname(outputPath), { recursive: true });
  const alternates = [
    { locale: 'en', url: `${siteOrigin}/tools/${slug}/` },
    ...Object.keys(tool.localizedSeoContent || {}).map((locale) => ({
      locale,
      url: `${siteOrigin}/${locale}/tools/${slug}/`,
    })),
    { locale: 'x-default', url: `${siteOrigin}/tools/${slug}/` },
  ];
  await writeFile(
    outputPath,
    prepareRouteHtml(template, {
      url: absoluteUrl,
      title,
      description,
      keywords: language === 'en' ? tool.keywords : '',
      schema,
      staticContent: renderToolFallback(contentTool, activeTools, {
        language,
        labels: translation?.labels,
      }),
      hreflangAlternates: alternates,
      hreflangIdPrefix: 'clickpdf-tool-hreflang',
      lang: language,
    }),
    'utf8',
  );
  generated.push(relativePath);
  if (language === 'en') toolPages.push({ name, url: absoluteUrl });
}

const blogFiles = (await readdir(blogDir)).filter((name) => name.endsWith('.md')).sort();
const articles = [];
for (const fileName of blogFiles) {
  const raw = await readFile(path.join(blogDir, fileName), 'utf8');
  const article = readFrontmatter(raw);
  if (!article.slug || !article.title) continue;
  const frontmatter = raw.match(/^---\r?\n[\s\S]*?\r?\n---\s*/);
  article.body = frontmatter ? raw.slice(frontmatter[0].length).trim() : raw.trim();
  article.path = articlePath(article);
  const coverSource = article.coverimage || article.image || defaultBlogCover;
  article.coverimage = blogWatermarkMap[coverSource] || coverSource;
  articles.push(article);
}

const translatedGroups = new Map();
for (const article of articles) {
  if (!article.translationgroup || !article.locale) continue;
  const group = translatedGroups.get(article.translationgroup) || [];
  group.push(article);
  translatedGroups.set(article.translationgroup, group);
}
const alternatesBySlug = new Map();
for (const group of translatedGroups.values()) {
  const alternates = group.map((article) => ({
    locale: article.locale,
    url: absoluteSiteUrl(`${siteOrigin}${article.path}`),
  }));
  const defaultUrl = alternates.find((alternate) => alternate.locale === 'en')?.url;
  const links = defaultUrl ? [...alternates, { locale: 'x-default', url: defaultUrl }] : alternates;
  group.forEach((article) => alternatesBySlug.set(article.slug, links));
}

const unicodeRouteMap = {};
const blogRouteMap = {
  '/blog': '/blog/',
};
for (const article of articles) {
  const routePath = articlePath(article);
  const url = absoluteSiteUrl(`${siteOrigin}${routePath}`);
  const decodedRoutePath = decodeURIComponent(routePath);
  const normalizedBlogRoute = `/${decodedRoutePath.replace(/^\/+|\/+$/g, '')}`;
  const canonicalBlogPath = new URL(routePath, siteOrigin).pathname;
  if (blogRouteMap[normalizedBlogRoute]) {
    throw new Error(`Duplicate blog route detected: ${normalizedBlogRoute}`);
  }
  blogRouteMap[normalizedBlogRoute] = canonicalBlogPath;
  const description = article.seodescription || article.summary || article.excerpt || article.title;
  const schema = makeBlogSchema(article, url);
  const relativePath = path.join(routePath.replace(/^\/|\/$/g, ''), 'index.html');
  const outputPath = path.join(outputDir, relativePath);
  const routeHtml = prepareRouteHtml(template, {
    url,
    title: article.seotitle || article.title,
    description,
    schema,
    ogType: 'article',
    socialImage: article.coverimage || socialImage,
    socialImageWidth: Number(article.coverwidth) || 1200,
    socialImageHeight: Number(article.coverheight) || 630,
    socialImageAlt: article.imagealt || article.title,
    hreflangAlternates: alternatesBySlug.get(article.slug) || [],
    robots: 'index,follow',
    staticContent: renderBlogFallback(article, articles),
    lang: article.locale || 'en',
  });
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, routeHtml, 'utf8');
  generated.push(relativePath);
  if (/[^\u0000-\u007f]/.test(decodedRoutePath)) {
    const hashedPath = `__unicode_routes__/${createHash('sha256').update(routePath).digest('hex').slice(0, 20)}.html`;
    const hashedOutputPath = path.join(outputDir, hashedPath);
    await mkdir(path.dirname(hashedOutputPath), { recursive: true });
    await writeFile(hashedOutputPath, routeHtml, 'utf8');
    unicodeRouteMap[decodedRoutePath] = `/${hashedPath}`;
  }
}

await writeFile(
  path.join(outputDir, '__unicode_routes.json'),
  JSON.stringify(unicodeRouteMap),
  'utf8',
);
await writeFile(
  path.join(outputDir, '__blog_routes.json'),
  JSON.stringify(blogRouteMap),
  'utf8',
);

const blogIndexUrl = `${siteOrigin}/blog/`;
const blogIndexSchema = makeBlogIndexSchema(articles, blogIndexUrl);
const blogIndexPath = path.join(outputDir, 'blog', 'index.html');
await mkdir(path.dirname(blogIndexPath), { recursive: true });
await writeFile(
  blogIndexPath,
  prepareRouteHtml(template, {
    url: blogIndexUrl,
    title: 'ClickPDF Knowledge Base & Privacy Guides',
    description: 'Explore ClickPDF guides on browser-based PDF tools, privacy, document processing, file formats, compression, everyday workflows, and troubleshooting.',
    schema: blogIndexSchema,
    robots: 'index,follow',
    staticContent: renderBlogIndexFallback(articles),
  }),
  'utf8',
);
generated.push('blog/index.html');

const toolsIndexUrl = `${siteOrigin}/tools/`;
const toolsIndexPath = path.join(outputDir, 'tools', 'index.html');
await mkdir(path.dirname(toolsIndexPath), { recursive: true });
await writeFile(
  toolsIndexPath,
  prepareRouteHtml(template, {
    url: toolsIndexUrl,
    title: 'All PDF Tools for Documents | ClickPDF',
    description: 'Browse ClickPDF’s PDF tools for merging, splitting, compressing, converting, editing, organizing, and securing documents in your browser. Choose a tool.',
    schema: makeToolsIndexSchema(activeTools, toolsIndexUrl),
    robots: 'index,follow',
    staticContent: renderToolsIndexFallback(activeTools),
  }),
  'utf8',
);
generated.push('tools/index.html');

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
    description: 'Find answers about browser-based PDF processing, privacy and third-party network requests, tool capabilities, file limits, compatibility, and downloads.',
    schema: makeFaqRouteSchema(faqItems, faqUrl),
    robots: 'index,follow',
    staticContent: renderFaqFallback(faqItems),
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
    description: 'Process several documents sequentially in your browser, apply a selected tool to each file, and download results individually or together as a ZIP file.',
    schema: makeBatchRouteSchema(batchUrl),
    robots: 'index,follow',
    staticContent: renderBatchFallback(activeTools),
  }),
  'utf8',
);
generated.push('batch/index.html');

for (const page of legalPages) {
  const url = absoluteSiteUrl(`${siteOrigin}${page.path}`);
  const relativePath = path.join(page.path.replace(/^\/|\/$/g, ''), 'index.html');
  const outputPath = path.join(outputDir, relativePath);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    prepareRouteHtml(template, {
      url,
      title: page.title,
      description: page.description,
      schema: makeLegalPageSchema(page, url),
      robots: 'index,follow',
      staticContent: renderLegalPageFallback(page, legalPages),
    }),
    'utf8',
  );
  generated.push(relativePath);
}

const homeIndexPath = path.join(outputDir, 'index.html');
const homeTemplate = removeJsonLdScripts(template, [pageSchemaId, homeFaqSchemaId]);
const homeHtml = prepareRouteHtml(homeTemplate, {
  url: `${siteOrigin}/`,
  title: 'ClickPDF — Free In-Browser PDF Tools',
  description: 'Free browser-based PDF tools. Supported document files are processed locally in your browser; pages may load ads and other third-party resources.',
  schema: makeHomepageSchema(toolPages, faqItems),
  schemaId: homeSiteSchemaId,
  staticContent: renderHomeFallback(activeTools, articles, faqItems),
});
await writeFile(homeIndexPath, homeHtml, 'utf8');

if (!faqItems.length) throw new Error('FAQ_DATA contains no usable question and answer pairs');
console.log(
  `Generated raw-head Schema.org JSON-LD for ${toolPages.length} tools, ${articles.length} blog posts, ${legalPages.length} legal pages, blog index, FAQ page, batch page, and homepage.`,
);
