import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readRestoredToolPages, SITE_ORIGIN } from './restored-tool-page-data.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, '..');
const outputDir = path.join(appDir, 'dist', 'public');
const template = await readFile(path.join(outputDir, 'index.html'), 'utf8');
const { pages, englishPages } = await readRestoredToolPages(appDir);

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function setHtmlLanguage(html, locale, direction) {
  return html.replace(/<html\b[^>]*>/i, (tag) => {
    const setAttribute = (current, name, value) => {
      const expression = new RegExp(`\\b${name}=["'][^"']*["']`, 'i');
      return expression.test(current)
        ? current.replace(expression, `${name}="${value}"`)
        : current.replace(/>$/, ` ${name}="${value}">`);
    };
    return setAttribute(setAttribute(tag, 'lang', locale), 'dir', direction);
  });
}

function setMetaTags(html, values) {
  const names = new Set(Object.keys(values));
  html = html.replace(/<meta\b[^>]*>/gi, (tag) => {
    for (const kind of ['name', 'property']) {
      const match = tag.match(new RegExp(`\\b${kind}=["']([^"']+)["']`, 'i'));
      if (match && names.has(`${kind}|${match[1]}`)) return '';
    }
    return tag;
  });
  const tags = Object.entries(values)
    .map(([key, content]) => {
      const separator = key.indexOf('|');
      const kind = key.slice(0, separator);
      const name = key.slice(separator + 1);
      return `    <meta ${kind}="${escapeHtml(name)}" content="${escapeHtml(content)}" />`;
    })
    .join('\n');
  return html.replace('</head>', `${tags}\n  </head>`);
}

function renderStaticContent(page) {
  const { labels, content } = page;
  const secondaryOverview = content.secondaryOverview
    ? `<p>${escapeHtml(content.secondaryOverview)}</p>`
    : '';
  const privacyHighlight = content.privacyHighlight
    ? `<p>${escapeHtml(content.privacyHighlight)}</p>`
    : '';
  const benefits = content.benefits?.length
    ? `<section><h2>Key benefits</h2><ul>${content.benefits.map((benefit) => `<li><h3>${escapeHtml(benefit.title)}</h3><p>${escapeHtml(benefit.desc)}</p></li>`).join('\n')}</ul></section>`
    : '';
  const steps = content.steps
    .map((step) => `<li><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.description)}</p></li>`)
    .join('\n');
  const faqs = content.faqs
    .map((faq) => `<details><summary>${escapeHtml(faq.question)}</summary><p>${escapeHtml(faq.answer)}</p></details>`)
    .join('\n');
  return [
    '<main id="seo-static-content" aria-labelledby="seo-tool-title">',
    `<h1 id="seo-tool-title">${escapeHtml(page.title)}</h1>`,
    `<section><h2>${escapeHtml(content.introHeading || labels.quickAnswer)}</h2><p>${escapeHtml(content.intro)}</p>${secondaryOverview}${privacyHighlight}</section>`,
    benefits,
    `<section><h2>${escapeHtml(content.stepsHeading || labels.howTo)}</h2><ol>${steps}</ol></section>`,
    `<section><h2>${escapeHtml(labels.faq)}</h2>${faqs}</section>`,
    '</main>',
  ].join('\n');
}

function renderStructuredData(page) {
  if (page.toolSeo) {
    const toolSeo = page.toolSeo;
    const schemaGraph = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          '@id': `${page.canonical}#software`,
          name: toolSeo.h1Title,
          url: page.canonical,
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'All (Chrome, Safari, Firefox, Edge, iOS, Android)',
          description: toolSeo.metaDescription,
          creator: {
            '@type': 'Organization',
            name: 'Click Digital Services',
            slogan: 'Stay Secure, Stay Smart - Your Data, Your Privacy - 100% Private',
            url: 'https://clickpdf.net',
          },
          publisher: {
            '@type': 'Organization',
            name: 'Click Digital Services',
            slogan: 'Stay Secure, Stay Smart - Your Data, Your Privacy - 100% Private',
            url: 'https://clickpdf.net',
          },
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          featureList: toolSeo.benefits.map((benefit) => `${benefit.title}: ${benefit.desc}`),
        },
        {
          '@type': 'HowTo',
          '@id': `${page.canonical}#howto`,
          name: toolSeo.stepsHeading,
          description: `Step-by-step instructions for using the ${toolSeo.h1Title} tool online for free.`,
          step: toolSeo.steps.map((step) => ({
            '@type': 'HowToStep',
            position: step.step,
            name: step.title,
            text: step.description,
          })),
        },
        {
          '@type': 'FAQPage',
          '@id': `${page.canonical}#faq`,
          mainEntity: toolSeo.faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: { '@type': 'Answer', text: faq.answer },
          })),
        },
      ],
    };
    return `<script type="application/ld+json" data-restored-tool-schema>${escapeJson(schemaGraph)}</script>`;
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.content.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: page.content.stepsHeading || page.title,
    step: page.content.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.title,
      text: step.description,
    })),
  };
  return `<script type="application/ld+json" data-restored-tool-schema>${escapeJson([faqSchema, howToSchema])}</script>`;
}

function renderPage(page) {
  const title = `${page.seoTitle} | ClickPDF`;
  const routeForLocale = (locale) => locale === 'en'
    ? `${SITE_ORIGIN}/tools/${page.slug}/`
    : `${SITE_ORIGIN}/${locale}/tools/${page.slug}/`;
  const alternates = page.alternateLocales.map((locale) => {
    return `    <link rel="alternate" hreflang="${locale}" href="${escapeHtml(routeForLocale(locale))}" />`;
  }).join('\n');
  const defaultPageCanonical = routeForLocale('en');
  let html = setHtmlLanguage(template, page.locale, page.direction);
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = setMetaTags(html, {
    'name|description': page.description,
    'name|robots': 'index,follow',
    'property|og:title': title,
    'property|og:description': page.description,
    'property|og:url': page.canonical,
    'name|twitter:title': title,
    'name|twitter:description': page.description,
    ...(page.toolSeo ? {
      'property|og:type': 'website',
      'name|twitter:card': 'summary_large_image',
      ...(page.ogImage
        ? { 'property|og:image': page.ogImage, 'name|twitter:image': page.ogImage }
        : {}),
    } : {}),
    ...(page.keywords ? { 'name|keywords': page.keywords } : {}),
  });
  html = html.replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi, '');
  html = html.replace(/<link\b[^>]*hreflang=["'][^"']*["'][^>]*>/gi, '');
  html = html.replace(
    '</head>',
    `    <link rel="canonical" href="${escapeHtml(page.canonical)}" />\n${alternates}\n    <link rel="alternate" hreflang="x-default" href="${escapeHtml(defaultPageCanonical)}" />\n  </head>`,
  );
  html = html.replace(
    '</body>',
    `${renderStaticContent(page)}\n${renderStructuredData(page)}\n  </body>`,
  );
  return html;
}

const staticPages = [...pages, ...englishPages];
for (const page of staticPages) {
  const relativePath = page.locale === 'en'
    ? path.join('tools', page.slug, 'index.html')
    : path.join(page.locale, 'tools', page.slug, 'index.html');
  const outputPath = path.join(outputDir, relativePath);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, renderPage(page));
}

console.log(`Generated ${staticPages.length} static tool pages (${pages.length} scoped locale pages and ${englishPages.length} English routes).`);
