import { SeoMetaConfig, BlogPost } from '../types';
import { getToolSeoInfo, ToolSeoInfo } from '../data/toolSeoData';
import { PUBLIC_PDF_TOOLS } from '../data/toolsData';

export const DEFAULT_SEO_CONFIG: SeoMetaConfig = {
  title: 'ClickPDF — Free In-Browser PDF Tools & Editor | Click Digital Services',
  description: 'Stay Secure, Stay Smart — Your Data, Your Privacy - 100% Private. Fast, private, client-side PDF utility suite by Click Digital Services with zero server uploads.',
  ogTitle: 'ClickPDF — Stay Secure, Stay Smart | 100% Private In-Browser PDF Tools',
  ogDescription: 'Stay Secure, Stay Smart — Your Data, Your Privacy - 100% Private. Fast, private, client-side PDF utility suite by Click Digital Services with zero server uploads.',
  ogImage: 'https://www.clickpdf.net/social/clickpdf-social-1200x630.png',
  keywords: 'pdf tools, click digital services, stay secure stay smart, 100% private pdf, merge pdf, split pdf, compress pdf, client side pdf, zero upload pdf, in browser pdf editor',
  canonicalUrl: 'https://www.clickpdf.net/',
  twitterCard: 'summary_large_image',
};

const SEO_STORAGE_KEY = 'clickpdf_seo_meta_config';
const PAGE_SCHEMA_SCRIPT_ID = 'clickpdf-page-schema';
const LEGACY_TOOL_SCHEMA_SCRIPT_ID = 'clickpdf-tool-schema';
const LEGACY_BLOG_SCHEMA_SCRIPT_ID = 'clickpdf-blog-schema';
const ORG_SCHEMA_SCRIPT_ID = 'clickpdf-org-schema';
const HOME_FAQ_SCHEMA_SCRIPT_ID = 'clickpdf-home-faq-schema';
const HOME_SITE_SCHEMA_SCRIPT_ID = 'clickpdf-home-site-schema';
const SITE_ORIGIN = 'https://www.clickpdf.net';
const SOCIAL_IMAGE_URL = `${SITE_ORIGIN}/social/clickpdf-social-1200x630.png`;
const SOCIAL_IMAGE_ALT = 'ClickPDF gold shield logo with a red PDF page and lightning bolt beside PDF tools';
const BRAND_LOGO_URL = `${SITE_ORIGIN}/icon-512.png`;

function brandLogoImage(origin = SITE_ORIGIN): Record<string, unknown> {
  const url = `${origin}/icon-512.png`;
  return {
    '@type': 'ImageObject',
    url,
    contentUrl: url,
    width: 512,
    height: 512,
  };
}

function applySocialImageTags(): void {
  setMetaTag('property', 'og:image', SOCIAL_IMAGE_URL);
  setMetaTag('property', 'og:image:width', '1200');
  setMetaTag('property', 'og:image:height', '630');
  setMetaTag('property', 'og:image:alt', SOCIAL_IMAGE_ALT);
  setMetaTag('name', 'twitter:image', SOCIAL_IMAGE_URL);
  setMetaTag('name', 'twitter:image:alt', SOCIAL_IMAGE_ALT);
}

export function getStoredSeoConfig(): SeoMetaConfig {
  if (typeof window === 'undefined') return DEFAULT_SEO_CONFIG;
  try {
    const raw = localStorage.getItem(SEO_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SEO_CONFIG, ...parsed };
    }
  } catch {
    // fallback
  }
  return DEFAULT_SEO_CONFIG;
}

export function saveSeoConfig(config: SeoMetaConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SEO_STORAGE_KEY, JSON.stringify(config));
    applySeoConfigToDom(config);
  } catch (err) {
    console.warn('Failed to save SEO config:', err);
  }
}

export function applySeoConfigToDom(config: SeoMetaConfig): void {
  if (typeof document === 'undefined') return;

  // 1. Title
  if (config.title) {
    document.title = config.title;
  }

  // 2. Standard Meta Description & Keywords
  setMetaTag('name', 'description', config.description);
  setMetaTag('name', 'keywords', config.keywords);

  // 3. Open Graph Tags
  setMetaTag('property', 'og:title', config.ogTitle || config.title);
  setMetaTag('property', 'og:description', config.ogDescription || config.description);
  applySocialImageTags();
  setMetaTag('property', 'og:url', canonicalizeClickPdfUrl(config.canonicalUrl));
  setMetaTag('property', 'og:type', 'website');

  // 4. Twitter Cards
  setMetaTag('name', 'twitter:card', config.twitterCard);
  setMetaTag('name', 'twitter:title', config.ogTitle || config.title);
  setMetaTag('name', 'twitter:description', config.ogDescription || config.description);

  // 5. Canonical link
  if (config.canonicalUrl) {
    updateCanonicalUrl(canonicalizeClickPdfUrl(config.canonicalUrl));
  }
}

/**
 * Dynamically applies specialized SEO metadata, OpenGraph tags, and Schema.org
 * structured data for an individual PDF tool landing view.
 */
export function applyToolSeo(toolSeo: ToolSeoInfo): void {
  if (typeof document === 'undefined') return;

  removeHomeFaqJsonLdSchema();
  removeHomeSiteJsonLdSchema();
  const origin = SITE_ORIGIN;
  const canonicalUrl = `${origin}/tools/${toolSeo.slug}/`;

  // 1. Dynamic Page Title
  document.title = toolSeo.metaTitle;

  // 2. Dynamic Description and High-Search-Volume Keywords
  setMetaTag('name', 'description', toolSeo.metaDescription);
  setMetaTag('name', 'keywords', toolSeo.keywords);

  // 3. OpenGraph Tags
  setMetaTag('property', 'og:title', toolSeo.metaTitle);
  setMetaTag('property', 'og:description', toolSeo.metaDescription);
  setMetaTag('property', 'og:url', canonicalUrl);
  setMetaTag('property', 'og:type', 'website');
  setMetaTag('property', 'og:site_name', 'ClickPDF');
  applySocialImageTags();

  // 4. Twitter Card
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', toolSeo.metaTitle);
  setMetaTag('name', 'twitter:description', toolSeo.metaDescription);

  // 5. Canonical Link
  updateCanonicalUrl(canonicalUrl);
  clearAlternateLanguageLinks();

  // 6. Schema.org JSON-LD Structured Data (SoftwareApplication + HowTo + FAQPage)
  injectToolJsonLdSchema(toolSeo, canonicalUrl);
}

/**
 * Adds SoftwareApplication structured data for tools that do not yet have
 * dedicated long-form SEO metadata. This keeps new registry tools covered.
 */
export function applyStandaloneToolSchema(
  name: string,
  description: string,
  canonicalUrl: string,
): void {
  if (typeof document === 'undefined') return;
  const pageUrl = canonicalizeClickPdfUrl(canonicalUrl);
  removeHomeFaqJsonLdSchema();
  removeHomeSiteJsonLdSchema();
  setPageJsonLdSchema({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${pageUrl}#software`,
    name,
    url: pageUrl,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    creator: { '@id': `${SITE_ORIGIN}/#organization` },
    publisher: { '@id': `${SITE_ORIGIN}/#organization` },
  });
}

/**
 * Dynamically applies specialized SEO metadata, OpenGraph tags, and BlogPosting
 * structured data for an individual blog post view (/blog/:slug).
 */
export function applyBlogSeo(article: BlogPost): void {
  if (typeof document === 'undefined') return;

  removeHomeFaqJsonLdSchema();
  removeHomeSiteJsonLdSchema();
  const origin = SITE_ORIGIN;
  const canonicalUrl = canonicalizeClickPdfUrl(new URL(
    article.routePath || `/blog/${encodeURIComponent(article.slug)}`,
    origin,
  ).toString());
  const fullTitle = article.seoTitle || `${article.title} — ClickPDF`;

  // 1. Dynamic Page Title
  document.title = fullTitle;

  // 2. Dynamic Description and Keywords
  const description = article.seoDescription || article.excerpt;
  const keywords = article.seoKeywords || `${article.category}, in-browser pdf, pdf privacy, clickpdf guide, ${article.title.toLowerCase()}`;
  setMetaTag('name', 'description', description);
  setMetaTag('name', 'keywords', keywords);
  setMetaTag('name', 'robots', 'index,follow');

  // 3. OpenGraph Tags
  setMetaTag('property', 'og:title', fullTitle);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:url', canonicalUrl);
  setMetaTag('property', 'og:type', 'article');
  setMetaTag('property', 'og:site_name', 'ClickPDF');
  applySocialImageTags();

  // 4. Twitter Card
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', fullTitle);
  setMetaTag('name', 'twitter:description', description);
  setMetaTag('name', 'twitter:card', 'summary_large_image');

  // 5. Canonical Link
  updateCanonicalUrl(canonicalUrl);
  setAlternateLanguageLinks(article.alternateUrls || []);

  // 6. Schema.org BlogPosting JSON-LD
  removeToolJsonLdSchema();
  injectBlogJsonLdSchema(article, canonicalUrl);
}

/**
 * Resets the SEO metadata back to the base homepage configuration.
 */
export function resetHomeSeo(customConfig?: SeoMetaConfig): void {
  if (typeof document === 'undefined') return;

  const config = customConfig || getStoredSeoConfig();
  const origin = SITE_ORIGIN;
  const homeCanonical = `${origin}/`;

  applySeoConfigToDom({
    ...config,
    canonicalUrl: homeCanonical,
  });

  // Clear legacy route-specific schemas and restore the homepage application schema.
  clearAlternateLanguageLinks();
  removeToolJsonLdSchema();
  removeBlogJsonLdSchema();
  document.getElementById(PAGE_SCHEMA_SCRIPT_ID)?.remove();
  injectHomeSiteJsonLdSchema();

  // Inject Organization & Brand JSON-LD schema linking ClickPDF.net to Click Digital Services
  injectHomeOrganizationJsonLd(origin);
}

export function applyStructuredPageSeo({
  title,
  description,
  canonicalUrl,
  schema,
}: {
  title: string;
  description: string;
  canonicalUrl: string;
  schema: Record<string, unknown>;
}): void {
  if (typeof document === 'undefined') return;
  removeHomeFaqJsonLdSchema();
  removeHomeSiteJsonLdSchema();
  document.title = title;
  setMetaTag('name', 'description', description);
  setMetaTag('name', 'robots', 'index,follow');
  setMetaTag('property', 'og:title', title);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:url', canonicalizeClickPdfUrl(canonicalUrl));
  setMetaTag('property', 'og:type', 'website');
  setMetaTag('property', 'og:site_name', 'ClickPDF');
  applySocialImageTags();
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', title);
  setMetaTag('name', 'twitter:description', description);
  updateCanonicalUrl(canonicalizeClickPdfUrl(canonicalUrl));
  clearAlternateLanguageLinks();
  removeToolJsonLdSchema();
  removeBlogJsonLdSchema();
  setPageJsonLdSchema(schema);
}

const BLOG_HREFLANG_LINK_PREFIX = 'clickpdf-blog-hreflang-';

function setAlternateLanguageLinks(alternates: Array<{ locale: string; url: string }>): void {
  clearAlternateLanguageLinks();
  alternates.forEach(({ locale, url }) => {
    if (!locale || !url) return;
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = locale;
    link.href = canonicalizeClickPdfUrl(url);
    link.dataset.blogHreflang = locale;
    link.id = `${BLOG_HREFLANG_LINK_PREFIX}${locale}`;
    document.head.appendChild(link);
  });
  const defaultUrl = alternates.find((item) => item.locale === 'en')?.url;
  if (defaultUrl) {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = 'x-default';
    link.href = defaultUrl;
    link.id = `${BLOG_HREFLANG_LINK_PREFIX}x-default`;
    document.head.appendChild(link);
  }
}

function clearAlternateLanguageLinks(): void {
  document.querySelectorAll(`link[id^="${BLOG_HREFLANG_LINK_PREFIX}"]`).forEach((link) => link.remove());
}

export function injectHomeOrganizationJsonLd(originUrl: string = 'https://www.clickpdf.net'): void {
  if (typeof document === 'undefined') return;
  const logoUrl = `${originUrl}/icon-512.png`;

  const orgSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${originUrl}/#organization`,
        name: 'Click Digital Services',
        legalName: 'Click Digital Services',
        url: originUrl,
        logo: {
          '@type': 'ImageObject',
          '@id': `${originUrl}/#logo`,
          url: logoUrl,
          contentUrl: logoUrl,
          width: 512,
          height: 512,
        },
        image: logoUrl,
        slogan: 'Stay Secure, Stay Smart - Your Data, Your Privacy - 100% Private',
        description: 'Technology studio and creator of ClickPDF.net, engineering 100% in-browser, zero-server privacy utilities.',
        brand: {
          '@type': 'Brand',
          name: 'ClickPDF',
          slogan: 'Stay Secure, Stay Smart - Your Data, Your Privacy - 100% Private',
          url: originUrl
        }
      }
    ]
  };

  setJsonLdScript(ORG_SCHEMA_SCRIPT_ID, orgSchema);
}

function injectHomeSiteJsonLdSchema(): void {
  const toolListItems = PUBLIC_PDF_TOOLS.flatMap((tool, index) => {
    const seo = getToolSeoInfo(tool.id);
    if (!seo) return [];
    return [{
      '@type': 'ListItem',
      position: index + 1,
      name: seo.h1Title || tool.title,
      url: `${SITE_ORIGIN}/tools/${seo.slug}/`,
    }];
  });
  setJsonLdScript(HOME_SITE_SCHEMA_SCRIPT_ID, {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_ORIGIN}/#website`,
        name: 'ClickPDF',
        alternateName: 'ClickPDF by Click Digital Services',
        url: `${SITE_ORIGIN}/`,
        image: brandLogoImage(),
        publisher: { '@id': `${SITE_ORIGIN}/#organization` },
      },
      {
        '@type': 'WebPage',
        '@id': `${SITE_ORIGIN}/#webpage`,
        url: `${SITE_ORIGIN}/`,
        name: 'ClickPDF — Free In-Browser PDF Tools',
        isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
        mainEntity: { '@id': `${SITE_ORIGIN}/#webapplication` },
      },
      {
        '@type': 'WebApplication',
        '@id': `${SITE_ORIGIN}/#webapplication`,
        name: 'ClickPDF',
        url: `${SITE_ORIGIN}/`,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web',
        description: 'Free browser-based PDF tools for merging, splitting, compressing, converting, editing and securing documents without uploading files to a processing server.',
        creator: { '@id': `${SITE_ORIGIN}/#organization` },
        publisher: { '@id': `${SITE_ORIGIN}/#organization` },
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
        '@id': `${SITE_ORIGIN}/#tools`,
        name: 'ClickPDF PDF tools',
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        numberOfItems: toolListItems.length,
        itemListElement: toolListItems,
      },
      {
        '@type': 'SiteNavigationElement',
        '@id': `${SITE_ORIGIN}/#site-navigation`,
        name: 'ClickPDF main navigation',
        hasPart: [
          { name: 'Home', url: `${SITE_ORIGIN}/` },
          { name: 'PDF Tools', url: `${SITE_ORIGIN}/#global-search-input` },
          { name: 'FAQ', url: `${SITE_ORIGIN}/faq/` },
          { name: 'Batch Processing Queue', url: `${SITE_ORIGIN}/batch/` },
          { name: 'Blog', url: `${SITE_ORIGIN}/blog/` },
        ].map((item) => ({ '@type': 'WebPage', ...item })),
      },
    ],
  });
}

function updateCanonicalUrl(url: string): void {
  let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = canonicalizeClickPdfUrl(url);
}

function canonicalizeClickPdfUrl(value: string): string {
  try {
    const url = new URL(value, SITE_ORIGIN);
    if (url.hostname.toLowerCase() === 'clickpdf.net') {
      url.hostname = 'www.clickpdf.net';
      url.protocol = 'https:';
    }
    if (url.hostname.toLowerCase() === 'www.clickpdf.net' && url.pathname !== '/' && !url.pathname.endsWith('/')) {
      url.pathname += '/';
    }
    return url.toString();
  } catch {
    return value;
  }
}

function injectToolJsonLdSchema(toolSeo: ToolSeoInfo, canonicalUrl: string): void {
  // Schema.org SoftwareApplication + HowTo + FAQPage rich graph
  const schemaGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        '@id': `${canonicalUrl}#software`,
        name: toolSeo.h1Title,
        url: canonicalUrl,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web',
        description: toolSeo.metaDescription,
        creator: { '@id': `${SITE_ORIGIN}/#organization` },
        publisher: { '@id': `${SITE_ORIGIN}/#organization` },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        },
        featureList: toolSeo.benefits.map(b => `${b.title}: ${b.desc}`)
      },
      {
        '@type': 'HowTo',
        '@id': `${canonicalUrl}#howto`,
        name: toolSeo.stepsHeading,
        description: `Step-by-step instructions for using the ${toolSeo.h1Title} tool online for free.`,
        step: toolSeo.steps.map(s => ({
          '@type': 'HowToStep',
          position: s.step,
          name: s.title,
          text: s.description
        }))
      },
      {
        '@type': 'FAQPage',
        '@id': `${canonicalUrl}#faq`,
        mainEntity: toolSeo.faqs.map(f => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.answer
          }
        }))
      }
    ]
  };

  setPageJsonLdSchema(schemaGraph);
}

function removeToolJsonLdSchema(): void {
  document.getElementById(LEGACY_TOOL_SCHEMA_SCRIPT_ID)?.remove();
}

function injectBlogJsonLdSchema(article: BlogPost, canonicalUrl: string): void {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${canonicalUrl}#blogposting`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl
    },
    url: canonicalUrl,
    headline: article.title,
    ...(article.seoTitle && article.seoTitle !== article.title
      ? { alternativeHeadline: article.seoTitle }
      : {}),
    description: article.seoDescription || article.excerpt,
    inLanguage: article.locale || 'en',
    image: article.coverImage
      ? [new URL(article.coverImage, SITE_ORIGIN).toString()]
      : [BRAND_LOGO_URL],
    ...(toIsoDate(article.date) ? { datePublished: toIsoDate(article.date) } : {}),
    ...(article.seoKeywords ? { keywords: article.seoKeywords } : {}),
    author: {
      '@type': 'Organization',
      name: article.author || 'ClickPDF Security & Editorial Team'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Click Digital Services',
      '@id': `${SITE_ORIGIN}/#organization`,
      url: SITE_ORIGIN,
      slogan: 'Stay Secure, Stay Smart - Your Data, Your Privacy - 100% Private',
      logo: {
        ...brandLogoImage(),
      }
    }
  };

  const graph: Array<Record<string, unknown>> = [articleSchema];
  if (article.breadcrumbs?.length) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl}#breadcrumb`,
      itemListElement: article.breadcrumbs.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: canonicalizeClickPdfUrl(new URL(item.url, SITE_ORIGIN).toString()),
      })),
    });
  }
  const faqItems = article.faqItems?.filter((item) => item.question.trim() && item.answer.trim()) || [];
  if (faqItems.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${canonicalUrl}#faq`,
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    });
  }

  setPageJsonLdSchema(
    graph.length === 1
      ? articleSchema
      : {
          '@context': 'https://schema.org',
          '@graph': graph.map((schema) =>
            Object.fromEntries(Object.entries(schema).filter(([key]) => key !== '@context')),
          ),
        },
  );
}

function removeBlogJsonLdSchema(): void {
  document.getElementById(LEGACY_BLOG_SCHEMA_SCRIPT_ID)?.remove();
}

function removeHomeFaqJsonLdSchema(): void {
  document.getElementById(HOME_FAQ_SCHEMA_SCRIPT_ID)?.remove();
}

function removeHomeSiteJsonLdSchema(): void {
  document.getElementById(HOME_SITE_SCHEMA_SCRIPT_ID)?.remove();
}

function setPageJsonLdSchema(schema: Record<string, unknown>): void {
  document.getElementById(LEGACY_TOOL_SCHEMA_SCRIPT_ID)?.remove();
  document.getElementById(LEGACY_BLOG_SCHEMA_SCRIPT_ID)?.remove();
  setJsonLdScript(PAGE_SCHEMA_SCRIPT_ID, schema);
}

function setJsonLdScript(id: string, schema: Record<string, unknown>): void {
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(schema).replace(/</g, '\\u003c');
}

function toIsoDate(value: string): string | undefined {
  const fullDate =
    /^\d{4}-\d{2}-\d{2}$/.test(value) ||
    /^[A-Za-z]+\s+\d{1,2},\s+\d{4}$/.test(value);
  if (!fullDate) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function setMetaTag(attrName: 'name' | 'property', attrValue: string, contentValue: string): void {
  if (!contentValue) return;
  let element = document.querySelector(`meta[${attrName}='${attrValue}']`) as HTMLMetaElement;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  element.content = contentValue;
}
