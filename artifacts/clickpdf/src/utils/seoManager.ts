import { SeoMetaConfig, BlogPost } from '../types';
import { ToolSeoInfo } from '../data/toolSeoData';

export const DEFAULT_SEO_CONFIG: SeoMetaConfig = {
  title: 'ClickPDF — Free In-Browser PDF Tools & Editor | Click Digital Services',
  description: 'Stay Secure, Stay Smart — Your Data, Your Privacy - 100% Private. Fast, private, client-side PDF utility suite by Click Digital Services with zero server uploads.',
  ogTitle: 'ClickPDF — Stay Secure, Stay Smart | 100% Private In-Browser PDF Tools',
  ogDescription: 'Stay Secure, Stay Smart — Your Data, Your Privacy - 100% Private. Fast, private, client-side PDF utility suite by Click Digital Services with zero server uploads.',
  ogImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
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
const SITE_ORIGIN = 'https://www.clickpdf.net';
let savedHomeFaqSchema: string | null = null;

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
  setMetaTag('property', 'og:image', config.ogImage);
  setMetaTag('property', 'og:url', canonicalizeClickPdfUrl(config.canonicalUrl));
  setMetaTag('property', 'og:type', 'website');

  // 4. Twitter Cards
  setMetaTag('name', 'twitter:card', config.twitterCard);
  setMetaTag('name', 'twitter:title', config.ogTitle || config.title);
  setMetaTag('name', 'twitter:description', config.ogDescription || config.description);
  setMetaTag('name', 'twitter:image', config.ogImage);

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
  const origin = SITE_ORIGIN;
  const canonicalUrl = `${origin}/tools/${toolSeo.slug}`;

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
  removeHomeFaqJsonLdSchema();
  setPageJsonLdSchema({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${canonicalUrl}#software`,
    name,
    url: canonicalUrl,
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
  const origin = SITE_ORIGIN;
  const canonicalUrl = new URL(
    article.routePath || `/blog/${encodeURIComponent(article.slug)}`,
    origin,
  ).toString();
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
  if (article.coverImage) {
    const imageUrl = new URL(article.coverImage, origin).toString();
    setMetaTag('property', 'og:image', imageUrl);
    setMetaTag('property', 'og:image:alt', article.imageAlt || article.title);
    setMetaTag('name', 'twitter:image', imageUrl);
    setMetaTag('name', 'twitter:image:alt', article.imageAlt || article.title);
  }

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
  injectHomeSoftwareApplicationJsonLd(homeCanonical, config.description);
  restoreHomeFaqJsonLdSchema();

  // Inject Organization & Brand JSON-LD schema linking ClickPDF.net to Click Digital Services
  injectHomeOrganizationJsonLd(origin);
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

  const orgSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${originUrl}/#organization`,
        name: 'Click Digital Services',
        legalName: 'Click Digital Services',
        url: originUrl,
        logo: `${originUrl}/icon.svg`,
        slogan: 'Stay Secure, Stay Smart - Your Data, Your Privacy - 100% Private',
        description: 'Technology studio and creator of ClickPDF.net, engineering 100% in-browser, zero-server privacy utilities.',
        brand: {
          '@type': 'Brand',
          name: 'ClickPDF',
          slogan: 'Stay Secure, Stay Smart - Your Data, Your Privacy - 100% Private',
          url: originUrl
        }
      },
      {
        '@type': 'WebSite',
        '@id': `${originUrl}/#website`,
        url: `${originUrl}/`,
        name: 'ClickPDF.net',
        description: 'Fast, private, client-side PDF utility suite by Click Digital Services with zero server uploads.',
        publisher: {
          '@id': `${originUrl}/#organization`
        }
      }
    ]
  };

  setJsonLdScript(ORG_SCHEMA_SCRIPT_ID, orgSchema);
}

function injectHomeSoftwareApplicationJsonLd(canonicalUrl: string, description: string): void {
  setPageJsonLdSchema({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${canonicalUrl}#software`,
    name: 'ClickPDF',
    url: canonicalUrl,
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
      : [`${SITE_ORIGIN}/icon.svg`],
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
        '@type': 'ImageObject',
        url: `${SITE_ORIGIN}/icon.svg`
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
  const script = document.getElementById(HOME_FAQ_SCHEMA_SCRIPT_ID) as HTMLScriptElement | null;
  if (!script) return;
  savedHomeFaqSchema = script.textContent;
  script.remove();
}

function restoreHomeFaqJsonLdSchema(): void {
  if (!savedHomeFaqSchema || document.getElementById(HOME_FAQ_SCHEMA_SCRIPT_ID)) return;
  setJsonLdScript(HOME_FAQ_SCHEMA_SCRIPT_ID, JSON.parse(savedHomeFaqSchema));
  savedHomeFaqSchema = null;
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
