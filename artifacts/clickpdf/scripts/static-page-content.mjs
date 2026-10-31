import MarkdownIt from 'markdown-it';

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: false,
  breaks: false,
});

function canonicalBlogToolHref(href) {
  try {
    const url = new URL(href, 'https://www.clickpdf.net');
    if (!['clickpdf.net', 'www.clickpdf.net'].includes(url.hostname)) return href;

    if (url.pathname === '/') {
      return `https://www.clickpdf.net/${url.search}${url.hash}`;
    }
    if (/^\/tools\/image-to-pdf\/?$/.test(url.pathname)) {
      return `/tools/image-to-pdf/${url.search}${url.hash}`;
    }
    if (/^\/tools\/compress-pdf\/?$/.test(url.pathname)) {
      return `/tools/compress-pdf/${url.search}${url.hash}`;
    }
  } catch {
    return href;
  }
  return href;
}

markdown.core.ruler.push('clickpdf-canonical-blog-tool-links', (state) => {
  for (const token of state.tokens) {
    if (token.type !== 'inline' || !token.children) continue;
    for (const child of token.children) {
      if (child.type !== 'link_open') continue;
      const href = child.attrGet('href');
      if (href) child.attrSet('href', canonicalBlogToolHref(href));
    }
  }
});

const inlineImageDimensions = new Map([
  ['/blog-assets/image-to-pdf/image-to-pdf-workflow.png', [1800, 840]],
  ['/blog-assets/image-to-pdf/image-to-pdf-file-processing.png', [1800, 974]],
  ['/blog-assets/merge-handwritten-assignment/page-order.webp', [1024, 576]],
  ['/blog-assets/merge-handwritten-assignment/scanning.webp', [1024, 576]],
  ['/blog-assets/merge-handwritten-assignment/submission.webp', [1024, 576]],
  ['/blog-assets/merge-or-reorder/merge-vs-page-order.jpg', [1024, 1024]],
  ['/blog-assets/reduce-pdf-assignment/compression.jpg', [1600, 900]],
  ['/blog-assets/reduce-pdf-assignment/scanned-pages.jpg', [1600, 900]],
  ['/blog-assets/reduce-pdf-assignment/submission.jpg', [1600, 900]],
  ['/blog-assets/college-assignment/clickpdf-assignment-document-order-4x3.jpg', [1200, 900]],
  ['/blog-assets/college-assignment/clickpdf-assignment-final-review-4x3.jpg', [1200, 900]],
]);

const defaultImageRenderer = markdown.renderer.rules.image;
markdown.renderer.rules.image = (tokens, index, options, env, renderer) => {
  const token = tokens[index];
  const source = token.attrGet('src')?.split('?')[0];
  const dimensions = source ? inlineImageDimensions.get(source) : undefined;
  if (dimensions) {
    token.attrSet('width', String(dimensions[0]));
    token.attrSet('height', String(dimensions[1]));
  }
  token.attrSet('loading', 'lazy');
  return defaultImageRenderer(tokens, index, options, env, renderer);
};

markdown.core.ruler.push('clickpdf-blog-heading-hierarchy', (state) => {
  let previousSourceLevel = null;
  let previousOutputLevel = 1;
  let activeOutputLevel = 2;

  for (const token of state.tokens) {
    if (token.type === 'heading_open') {
      const sourceLevel = Number(token.tag.slice(1)) || 1;
      let outputLevel = 2;

      if (previousSourceLevel !== null) {
        if (sourceLevel > previousSourceLevel) {
          outputLevel = Math.min(6, previousOutputLevel + 1);
        } else if (sourceLevel === previousSourceLevel) {
          outputLevel = previousOutputLevel;
        } else {
          outputLevel = Math.max(
            2,
            previousOutputLevel - (previousSourceLevel - sourceLevel),
          );
        }
      }

      activeOutputLevel = outputLevel;
      previousSourceLevel = sourceLevel;
      previousOutputLevel = outputLevel;
      token.tag = `h${outputLevel}`;
    } else if (token.type === 'heading_close') {
      token.tag = `h${activeOutputLevel}`;
    }
  }
});

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeText(value = '') {
  return String(value).replace(/\s+/g, ' ').trim().toLocaleLowerCase();
}

function withoutDuplicateTitle(body, title) {
  const lines = String(body || '').split(/\r?\n/);
  const firstLineIndex = lines.findIndex((line) => line.trim());
  if (firstLineIndex < 0) return '';

  const headingMatch = lines[firstLineIndex].match(/^#\s+(.+?)\s*#*\s*$/);
  if (!headingMatch) return lines.join('\n').trim();

  const renderedTitle = markdown.renderInline(headingMatch[1]).replace(/<[^>]*>/g, '');
  if (normalizeText(renderedTitle) !== normalizeText(title)) return lines.join('\n').trim();

  lines.splice(firstLineIndex, 1);
  return lines.join('\n').trim();
}

export function renderMarkdownBody(body, title) {
  return markdown.render(withoutDuplicateTitle(body, title));
}

function safeLocalPath(value, fallback = '/') {
  const path = String(value || '').trim();
  if (!path.startsWith('/') || path.startsWith('//') || /[\u0000-\u001f]/.test(path)) {
    return fallback;
  }
  return path;
}

function safeImageUrl(value) {
  const source = String(value || '').trim();
  if (source.startsWith('/') && !source.startsWith('//') && !/[\u0000-\u001f]/.test(source)) {
    return source;
  }
  try {
    const url = new URL(source);
    return ['https:', 'http:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

function linkList(items, label) {
  if (!items.length) return '';
  return `<nav aria-label="${escapeHtml(label)}"><h2>${escapeHtml(label)}</h2><ul>${items
    .map(({ name, url, description }) => `<li><a href="${escapeHtml(url)}">${escapeHtml(name)}</a>${description ? ` — ${escapeHtml(description)}` : ''}</li>`)
    .join('')}</ul></nav>`;
}

function firstSentence(value) {
  const text = String(value || '').trim();
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (!'.!?'.includes(character)) continue;
    if (character === '.' && /(?:e|i)\.g$/i.test(text.slice(0, index))) continue;
    if (index === text.length - 1 || /\s/.test(text[index + 1])) {
      return text.slice(0, index + 1);
    }
  }
  return text;
}

const quickAnswerLabels = {
  en: 'Quick answer',
  ar: 'إجابة سريعة',
  de: 'Kurzantwort',
  es: 'Respuesta rápida',
  fr: 'Réponse rapide',
  hi: 'संक्षिप्त उत्तर',
  id: 'Jawaban singkat',
  it: 'Risposta rapida',
  ja: '簡単な回答',
  ko: '빠른 답변',
  nl: 'Kort antwoord',
  no: 'Kort svar',
  pl: 'Krótka odpowiedź',
  pt: 'Resposta rápida',
  ru: 'Краткий ответ',
  sv: 'Snabbt svar',
  tl: 'Mabilis na sagot',
  tr: 'Kısa yanıt',
  ur: 'مختصر جواب',
  vi: 'Câu trả lời nhanh',
  zh: '简要回答',
};

function renderFaqItems(faqItems) {
  return faqItems
    .map((item, index) => `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`)
    .join('');
}

function fallbackPage({ title, description, content, lang = 'en' }) {
  return `<main id="seo-static-content" lang="${escapeHtml(lang)}" aria-label="${escapeHtml(title)}"><header><a href="https://www.clickpdf.net/">ClickPDF</a><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></header>${content}</main>`;
}

export function renderHomeFallback(tools, articles, faqItems = []) {
  const toolItems = tools.map((tool) => ({
    name: tool.name,
    url: `/tools/${encodeURIComponent(tool.slug)}/`,
    description: tool.description,
  }));
  const blogItems = articles.slice(0, 8).map((article) => ({
    name: article.title,
    url: article.path,
    description: article.summary || article.seodescription || article.title,
  }));
  const legalItems = [
    { name: 'About ClickPDF', url: '/about/' },
    { name: 'Contact ClickPDF', url: '/contact/' },
    { name: 'Privacy Policy', url: '/privacy-policy/' },
    { name: 'Terms of Service', url: '/terms-of-service/' },
    { name: 'Cookies Policy', url: '/cookies/' },
    { name: 'Disclaimer', url: '/disclaimer/' },
  ];
  const content = [
    '<section aria-labelledby="seo-home-tools"><h2 id="seo-home-tools">PDF tools</h2><ul>',
    ...toolItems.map((tool) => `<li><article><h3><a href="${escapeHtml(tool.url)}">${escapeHtml(tool.name)}</a></h3><p>${escapeHtml(tool.description)}</p></article></li>`),
    '</ul></section>',
    '<section aria-labelledby="seo-home-privacy"><h2 id="seo-home-privacy">In-browser document tools</h2><p>ClickPDF tools process selected document contents in the browser where supported. The website may still load page resources or enabled third-party services; review each tool’s details and privacy information.</p></section>',
    linkList(blogItems, 'Recent ClickPDF guides'),
    faqItems.length
      ? `<section aria-labelledby="seo-home-faq"><h2 id="seo-home-faq">Frequently asked questions</h2>${renderFaqItems(faqItems)}</section>`
      : '',
    linkList(legalItems, 'Company and policy pages'),
    '<nav aria-label="Site pages"><ul><li><a href="/faq/">Frequently asked questions</a></li><li><a href="/blog/">Guides and articles</a></li><li><a href="/batch/">Batch processing queue</a></li></ul></nav>',
  ].join('');
  return fallbackPage({
    title: 'Free PDF tools that work in your browser',
    description: 'Convert, compress, merge, and edit PDFs online with free browser-based tools. Your files are processed in your browser whenever supported, helping keep your documents private.',
    content,
  });
}

export function renderToolsIndexFallback(tools) {
  const content = [
    '<section aria-labelledby="seo-tools-index-list"><h2 id="seo-tools-index-list">Available PDF tools</h2><ul>',
    ...tools.map((tool) => `<li data-tool-id="${escapeHtml(tool.id)}"><article><h3><a href="/tools/${encodeURIComponent(tool.slug)}/">${escapeHtml(tool.name)}</a></h3><p>${escapeHtml(tool.description)}</p></article></li>`),
    '</ul></section>',
  ].join('');

  return fallbackPage({
    title: 'All PDF Tools',
    description: 'Browse the available ClickPDF tools for working with supported PDF documents in your browser.',
    content,
  });
}

export function renderToolFallback(tool, tools, { language = 'en', labels = {} } = {}) {
  const byId = new Map(tools.map((item) => [item.id, item]));
  const isEnglish = language === 'en';
  const relatedTools = (tool.relatedToolIds || [])
    .map((id) => byId.get(id))
    .filter(Boolean);
  const benefits = isEnglish && tool.benefits?.length
    ? `<section aria-labelledby="seo-tool-features"><h2 id="seo-tool-features">Key features</h2><ul>${tool.benefits
      .map((benefit) => `<li><h3>${escapeHtml(benefit.title)}</h3><p>${escapeHtml(benefit.desc)}</p></li>`)
      .join('')}</ul></section>`
    : '';
  const toolOverview = isEnglish && tool.overviewHeading && tool.overview && tool.secondaryOverview
    ? `<section aria-labelledby="seo-tool-overview"><p><strong>${escapeHtml(tool.badge)}</strong></p><h2 id="seo-tool-overview">${escapeHtml(tool.overviewHeading)}</h2><p>${escapeHtml(tool.overview)}</p><p>${escapeHtml(tool.secondaryOverview)}</p></section>`
    : !isEnglish && tool.introHeading && tool.intro
      ? `<section aria-labelledby="seo-tool-overview"><h2 id="seo-tool-overview">${escapeHtml(tool.introHeading)}</h2><p>${escapeHtml(tool.intro)}</p></section>`
      : '';
  const steps = `<section aria-labelledby="seo-tool-steps"><h2 id="seo-tool-steps">${escapeHtml(tool.stepsHeading || `How to use ${tool.name}`)}</h2><ol>${tool.steps
    .map((step) => `<li><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.description)}</p></li>`)
    .join('')}</ol></section>`;
  const directAction = firstSentence(tool.shortDescription || tool.description || '')
    .replace(/[.!?]\s*$/, '')
    .replace(/^./, (character) => character.toLowerCase());
  const directAnswer = isEnglish
    ? `<section aria-label="${escapeHtml(tool.directAnswerLabel || 'Quick answer')}"><p><strong>${escapeHtml(tool.directAnswerLabel || 'Quick answer')}:</strong> Use ${escapeHtml(tool.toolLabel || tool.name)} to ${escapeHtml(directAction)}. ${escapeHtml(tool.directAnswerSecondSentence || 'Selected files are processed locally in your browser; performance depends on browser support and available device memory.')}</p></section>`
    : `<section aria-label="${escapeHtml(labels.quickAnswer || '')}"><p><strong>${escapeHtml(labels.quickAnswer || '')}:</strong> ${escapeHtml(tool.description || '')}</p></section>`;
  const toolPrivacySummary = tool.privacySummary
    ? `<section aria-label="${escapeHtml(labels.privacy || 'Tool-specific summary')}"><p>${escapeHtml(tool.privacySummary)}</p></section>`
    : '';
  const faqs = `<section aria-labelledby="seo-tool-faq"><h2 id="seo-tool-faq">${escapeHtml(labels.faq || 'Frequently asked questions')}</h2>${tool.faqs
    .map((faq) => `<details><summary>${escapeHtml(faq.question)}</summary><p>${escapeHtml(faq.answer)}</p></details>`)
    .join('')}</section>`;
  const links = linkList(
    relatedTools.map((related) => {
      const relatedTitle = related.localizedTitles?.[language];
      const hasLocalizedRoute = Boolean(related.localizedSeoContent?.[language] && relatedTitle);
      return {
        name: relatedTitle?.title || related.name,
        url: `${hasLocalizedRoute ? `/${language}` : ''}/tools/${encodeURIComponent(related.slug)}/`,
        description: relatedTitle?.description || related.description,
      };
    }),
    labels.relatedTools || 'Related PDF tools',
  );
  return fallbackPage({
    title: tool.name,
    description: tool.description,
    content: `${directAnswer}${toolPrivacySummary}${toolOverview}${benefits}${steps}${faqs}${links}<p><a href="/">${escapeHtml(labels.browseTools || 'Browse all ClickPDF tools')}</a></p>`,
  });
}

export function renderBlogFallback(article, articles) {
  const coverImageUrl = safeImageUrl(article.coverimage);
  const coverImageWidth = Number(article.coverwidth) || 1200;
  const coverImageHeight = Number(article.coverheight) || 630;
  const coverImage = coverImageUrl
    ? `<figure><img src="${escapeHtml(coverImageUrl)}" alt="${escapeHtml(article.imagealt || article.title)}" width="${coverImageWidth}" height="${coverImageHeight}" loading="lazy" style="display:block;width:100%;height:auto" /><figcaption>${escapeHtml(article.imagealt || article.title)}</figcaption></figure>`
    : '';
  const metadata = `<p><span>${escapeHtml(article.author || 'ClickPDF Editorial Team')}</span>${article.date ? ` · <time>${escapeHtml(article.date)}</time>` : ''}${article.category ? ` · <span>${escapeHtml(article.category)}</span>` : ''}</p>`;
  const quickAnswer = article.quickanswer || article.summary || article.excerpt || article.seodescription || article.title;
  const quickAnswerLabel = quickAnswerLabels[article.locale] || quickAnswerLabels.en;
  const quickAnswerBox = `<aside aria-labelledby="blog-quick-answer-heading" style="margin:1.25rem 0;padding:1rem 1.125rem;border:1px solid #c7d2fe;border-left:4px solid #4f46e5;border-radius:0.875rem;background:linear-gradient(135deg,#f5f7ff 0%,#ffffff 100%);box-shadow:0 4px 14px rgba(30,41,59,.06)"><h2 id="blog-quick-answer-heading" style="margin:0 0 .4rem;color:#3730a3;font-size:1.05rem;line-height:1.4">${escapeHtml(quickAnswerLabel)}</h2><p style="margin:0;color:#334155;line-height:1.65">${escapeHtml(quickAnswer)}</p></aside>`;
  const targetToolUrl = safeLocalPath(article.targettoolurl || article.targettoollink || article.toollink, '');
  const targetTool = targetToolUrl
    ? `<p><a href="${escapeHtml(targetToolUrl.endsWith('/') ? targetToolUrl : `${targetToolUrl}/`)}">${escapeHtml(article.targettoolcta || article.targettooltitle || 'Open the related PDF tool')}</a></p>`
    : '';
  const relatedPosts = articles
    .filter((candidate) => candidate.slug !== article.slug && candidate.translationgroup !== article.translationgroup)
    .slice(0, 3)
    .map((candidate) => ({
      name: candidate.title,
      url: candidate.path,
      description: candidate.summary || candidate.seodescription || '',
    }));
  const content = `<article>${quickAnswerBox}${metadata}${coverImage}<p>${escapeHtml(article.summary || article.excerpt || article.seodescription || '')}</p>${renderMarkdownBody(article.body, article.title)}${targetTool}</article>${linkList(relatedPosts, 'Related ClickPDF guides')}<p><a href="/blog/">Browse all ClickPDF guides</a></p>`;
  return fallbackPage({
    title: article.title,
    description: article.seodescription || article.summary || article.excerpt || article.title,
    content,
    lang: article.locale || 'en',
  });
}

export function renderBlogIndexFallback(articles) {
  const articleList = articles.map((article) => ({
    name: article.title,
    url: article.path,
    description: article.summary || article.seodescription || article.excerpt || '',
  }));
  return fallbackPage({
    title: 'ClickPDF Knowledge Base & Privacy Guides',
    description: 'Explore ClickPDF guides on browser-based PDF tools, privacy, document processing, file formats, compression, everyday workflows, and troubleshooting.',
    content: `${linkList(articleList, 'ClickPDF guides and articles')}<p><a href="/">Browse all ClickPDF tools</a></p>`,
  });
}

export function renderFaqFallback(faqItems) {
  const content = `<section aria-labelledby="seo-faq-list"><h2 id="seo-faq-list">Questions and answers</h2>${renderFaqItems(faqItems)}</section><p><a href="/">Browse all ClickPDF tools</a></p>`;
  return fallbackPage({
    title: 'Frequently Asked Questions',
    description: 'Find answers about browser-based PDF processing, privacy and third-party network requests, tool capabilities, file limits, compatibility, and downloads.',
    content,
  });
}

export function renderBatchFallback(tools) {
  const links = tools.map((tool) => ({
    name: tool.name,
    url: `/tools/${encodeURIComponent(tool.slug)}/`,
    description: tool.description,
  }));
  return fallbackPage({
    title: 'Batch Processing Queue',
    description: 'Process several documents sequentially in your browser, apply a selected tool to each file, and download results individually or together as a ZIP file.',
    content: `<p>Use the batch queue to process multiple documents in the browser and download available results individually or as a ZIP. File capacity depends on the device and browser.</p>${linkList(links, 'Available PDF tools')}`,
  });
}

export function renderLegalPageFallback(page, legalPages = []) {
  const sections = (page.sections || []).map((section, index) => {
    const paragraphs = (section.paragraphs || [])
      .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
      .join('');
    const email = page.id === 'contact' && section.heading === 'Email support' && page.contactEmail
      ? `<p><a href="mailto:${escapeHtml(page.contactEmail)}">${escapeHtml(page.contactEmail)}</a></p>`
      : '';
    return `<section aria-labelledby="legal-section-${index + 1}"><h2 id="legal-section-${index + 1}">${escapeHtml(section.heading)}</h2>${paragraphs}${email}</section>`;
  }).join('');
  const links = linkList(
    legalPages
      .filter((candidate) => candidate.id !== page.id)
      .map((candidate) => ({
        name: candidate.heading,
        url: safeLocalPath(candidate.path),
        description: candidate.description,
      })),
    'Related company and policy pages',
  );
  return fallbackPage({
    title: page.heading,
    description: page.description,
    content: `<article>${sections}</article>${links}<p><a href="/">Browse all ClickPDF tools</a></p>`,
  });
}
