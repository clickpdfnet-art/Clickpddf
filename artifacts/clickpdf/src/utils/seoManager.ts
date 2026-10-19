import { SeoMetaConfig, BlogPost } from '../types';
import { ToolSeoInfo } from '../data/toolSeoData';

export const DEFAULT_SEO_CONFIG: SeoMetaConfig = {
  title: 'ClickPDF — Free In-Browser PDF Tools & Editor | Click Digital Services',
  description: 'Stay Secure, Stay Smart — Your Data, Your Privacy - 100% Private. Fast, private, client-side PDF utility suite by Click Digital Services with zero server uploads.',
  ogTitle: 'ClickPDF — Stay Secure, Stay Smart | 100% Private In-Browser PDF Tools',
  ogDescription: 'Stay Secure, Stay Smart — Your Data, Your Privacy - 100% Private. Fast, private, client-side PDF utility suite by Click Digital Services with zero server uploads.',
  ogImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
  keywords: 'pdf tools, click digital services, stay secure stay smart, 100% private pdf, merge pdf, split pdf, compress pdf, client side pdf, zero upload pdf, in browser pdf editor',
  canonicalUrl: 'https://clickpdf.net',
  twitterCard: 'summary_large_image',
};

const SEO_STORAGE_KEY = 'clickpdf_seo_meta_config';
const TOOL_SCHEMA_SCRIPT_ID = 'clickpdf-tool-schema';
const BLOG_SCHEMA_SCRIPT_ID = 'clickpdf-blog-schema';
const ORG_SCHEMA_SCRIPT_ID = 'clickpdf-org-schema';

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
  setMetaTag('property', 'og:url', config.canonicalUrl);
  setMetaTag('property', 'og:type', 'website');

  // 4. Twitter Cards
  setMetaTag('name', 'twitter:card', config.twitterCard);
  setMetaTag('name', 'twitter:title', config.ogTitle || config.title);
  setMetaTag('name', 'twitter:description', config.ogDescription || config.description);
  setMetaTag('name', 'twitter:image', config.ogImage);

  // 5. Canonical link
  if (config.canonicalUrl) {
    updateCanonicalUrl(config.canonicalUrl);
  }
}

/**
 * Dynamically applies specialized SEO metadata, OpenGraph tags, and Schema.org
 * structured data for an individual PDF tool landing view.
 */
export function applyToolSeo(toolSeo: ToolSeoInfo): void {
  if (typeof document === 'undefined') return;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://clickpdf.net';
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

  // 6. Schema.org JSON-LD Structured Data (WebApplication + HowTo + FAQPage)
  removeBlogJsonLdSchema();
  injectToolJsonLdSchema(toolSeo, canonicalUrl);
}

/**
 * Dynamically applies specialized SEO metadata, OpenGraph tags, and Schema.org
 * Article structured data for an individual Blog Post landing view (/blog/:slug).
 */
export function applyBlogSeo(article: BlogPost): void {
  if (typeof document === 'undefined') return;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://clickpdf.net';
  const canonicalUrl = `${origin}/blog/${article.slug}`;
  const fullTitle = `${article.title} — ClickPDF`;

  // 1. Dynamic Page Title
  document.title = fullTitle;

  // 2. Dynamic Description and Keywords
  setMetaTag('name', 'description', article.excerpt);
  setMetaTag('name', 'keywords', `${article.category}, in-browser pdf, pdf privacy, clickpdf guide, ${article.title.toLowerCase()}`);

  // 3. OpenGraph Tags
  setMetaTag('property', 'og:title', fullTitle);
  setMetaTag('property', 'og:description', article.excerpt);
  setMetaTag('property', 'og:url', canonicalUrl);
  setMetaTag('property', 'og:type', 'article');
  if (article.coverImage) {
    setMetaTag('property', 'og:image', article.coverImage);
  }

  // 4. Twitter Card
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', fullTitle);
  setMetaTag('name', 'twitter:description', article.excerpt);
  if (article.coverImage) {
    setMetaTag('name', 'twitter:image', article.coverImage);
  }

  // 5. Canonical Link
  updateCanonicalUrl(canonicalUrl);

  // 6. Schema.org Article JSON-LD
  removeToolJsonLdSchema();
  injectBlogJsonLdSchema(article, canonicalUrl);
}

/**
 * Resets the SEO metadata back to the base homepage configuration.
 */
export function resetHomeSeo(customConfig?: SeoMetaConfig): void {
  if (typeof document === 'undefined') return;

  const config = customConfig || getStoredSeoConfig();
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://clickpdf.net';
  const homeCanonical = `${origin}/`;

  applySeoConfigToDom({
    ...config,
    canonicalUrl: homeCanonical,
  });

  // Remove tool-specific & blog-specific JSON-LD schemas
  removeToolJsonLdSchema();
  removeBlogJsonLdSchema();

  // Inject Organization & Brand JSON-LD schema linking ClickPDF.net to Click Digital Services
  injectHomeOrganizationJsonLd(origin);
}

export function injectHomeOrganizationJsonLd(originUrl: string = 'https://clickpdf.net'): void {
  if (typeof document === 'undefined') return;

  let script = document.getElementById(ORG_SCHEMA_SCRIPT_ID) as HTMLScriptElement;
  if (!script) {
    script = document.createElement('script');
    script.id = ORG_SCHEMA_SCRIPT_ID;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

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

  script.textContent = JSON.stringify(orgSchema);
}

function updateCanonicalUrl(url: string): void {
  let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = url;
}

function injectToolJsonLdSchema(toolSeo: ToolSeoInfo, canonicalUrl: string): void {
  let script = document.getElementById(TOOL_SCHEMA_SCRIPT_ID) as HTMLScriptElement;
  if (!script) {
    script = document.createElement('script');
    script.id = TOOL_SCHEMA_SCRIPT_ID;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  // Schema.org WebApplication + HowTo + FAQPage rich graph
  const schemaGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': `${canonicalUrl}#software`,
        name: toolSeo.h1Title,
        url: canonicalUrl,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'All (Chrome, Safari, Firefox, Edge, iOS, Android)',
        description: toolSeo.metaDescription,
        creator: {
          '@type': 'Organization',
          name: 'Click Digital Services',
          slogan: 'Stay Secure, Stay Smart - Your Data, Your Privacy - 100% Private',
          url: 'https://clickpdf.net'
        },
        publisher: {
          '@type': 'Organization',
          name: 'Click Digital Services',
          slogan: 'Stay Secure, Stay Smart - Your Data, Your Privacy - 100% Private',
          url: 'https://clickpdf.net'
        },
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

  script.textContent = JSON.stringify(schemaGraph);
}

function removeToolJsonLdSchema(): void {
  const script = document.getElementById(TOOL_SCHEMA_SCRIPT_ID);
  if (script) {
    script.remove();
  }
}

function injectBlogJsonLdSchema(article: BlogPost, canonicalUrl: string): void {
  let script = document.getElementById(BLOG_SCHEMA_SCRIPT_ID) as HTMLScriptElement;
  if (!script) {
    script = document.createElement('script');
    script.id = BLOG_SCHEMA_SCRIPT_ID;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl
    },
    headline: article.title,
    description: article.excerpt,
    image: article.coverImage ? [article.coverImage] : ['https://clickpdf.net/icon.svg'],
    datePublished: article.date,
    dateModified: article.date,
    author: {
      '@type': 'Person',
      name: article.author || 'ClickPDF Security & Editorial Team'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Click Digital Services',
      url: 'https://clickpdf.net',
      slogan: 'Stay Secure, Stay Smart - Your Data, Your Privacy - 100% Private',
      logo: {
        '@type': 'ImageObject',
        url: 'https://clickpdf.net/icon.svg'
      }
    }
  };

  script.textContent = JSON.stringify(articleSchema);
}

function removeBlogJsonLdSchema(): void {
  const script = document.getElementById(BLOG_SCHEMA_SCRIPT_ID);
  if (script) {
    script.remove();
  }
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
