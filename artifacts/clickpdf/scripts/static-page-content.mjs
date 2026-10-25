import MarkdownIt from 'markdown-it';

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: false,
  breaks: false,
});

for (const ruleName of ['heading_open', 'heading_close']) {
  const defaultRule = markdown.renderer.rules[ruleName] ||
    ((tokens, index, options, _env, renderer) => renderer.renderToken(tokens, index, options));
  markdown.renderer.rules[ruleName] = (tokens, index, options, env, renderer) => {
    const token = tokens[index];
    const previousTag = token.tag;
    const level = Number(previousTag.slice(1)) || 1;
    token.tag = `h${Math.min(6, level + 1)}`;
    const rendered = defaultRule(tokens, index, options, env, renderer);
    token.tag = previousTag;
    return rendered;
  };
}

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

function linkList(items, label) {
  if (!items.length) return '';
  return `<nav aria-label="${escapeHtml(label)}"><h2>${escapeHtml(label)}</h2><ul>${items
    .map(({ name, url, description }) => `<li><a href="${escapeHtml(url)}">${escapeHtml(name)}</a>${description ? ` — ${escapeHtml(description)}` : ''}</li>`)
    .join('')}</ul></nav>`;
}

function fallbackPage({ title, description, content, lang = 'en' }) {
  return `<main id="seo-static-content" lang="${escapeHtml(lang)}" aria-label="${escapeHtml(title)}"><header><a href="https://www.clickpdf.net/">ClickPDF</a><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></header>${content}</main>`;
}

export function renderHomeFallback(tools, articles) {
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
  const content = [
    '<section aria-labelledby="seo-home-tools"><h2 id="seo-home-tools">PDF tools</h2><ul>',
    ...toolItems.map((tool) => `<li><article><h3><a href="${escapeHtml(tool.url)}">${escapeHtml(tool.name)}</a></h3><p>${escapeHtml(tool.description)}</p></article></li>`),
    '</ul></section>',
    '<section aria-labelledby="seo-home-privacy"><h2 id="seo-home-privacy">In-browser document tools</h2><p>ClickPDF tools process selected document contents in the browser where supported. The website may still load page resources or enabled third-party services; review each tool’s details and privacy information.</p></section>',
    linkList(blogItems, 'Recent ClickPDF guides'),
    '<nav aria-label="Site pages"><ul><li><a href="/faq/">Frequently asked questions</a></li><li><a href="/blog/">Guides and articles</a></li><li><a href="/batch/">Batch processing queue</a></li></ul></nav>',
  ].join('');
  return fallbackPage({
    title: 'Stay Secure, Stay Smart',
    description: 'Free browser-based PDF tools for merging, splitting, compressing, converting, editing and organizing documents.',
    content,
  });
}

export function renderToolFallback(tool, tools) {
  const byId = new Map(tools.map((item) => [item.id, item]));
  const relatedTools = (tool.relatedToolIds || [])
    .map((id) => byId.get(id))
    .filter(Boolean);
  const benefits = tool.benefits?.length
    ? `<section aria-labelledby="seo-tool-features"><h2 id="seo-tool-features">Key features</h2><ul>${tool.benefits
      .map((benefit) => `<li><h3>${escapeHtml(benefit.title)}</h3><p>${escapeHtml(benefit.desc)}</p></li>`)
      .join('')}</ul></section>`
    : '';
  const steps = `<section aria-labelledby="seo-tool-steps"><h2 id="seo-tool-steps">${escapeHtml(tool.stepsHeading || `How to use ${tool.name}`)}</h2><ol>${tool.steps
    .map((step) => `<li><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.description)}</p></li>`)
    .join('')}</ol></section>`;
  const faqs = `<section aria-labelledby="seo-tool-faq"><h2 id="seo-tool-faq">Frequently asked questions</h2>${tool.faqs
    .map((faq) => `<details><summary>${escapeHtml(faq.question)}</summary><p>${escapeHtml(faq.answer)}</p></details>`)
    .join('')}</section>`;
  const links = linkList(
    relatedTools.map((related) => ({
      name: related.name,
      url: `/tools/${encodeURIComponent(related.slug)}/`,
      description: related.description,
    })),
    'Related PDF tools',
  );
  return fallbackPage({
    title: tool.name,
    description: tool.description,
    content: `${benefits}${steps}${faqs}${links}<p><a href="/">Browse all ClickPDF tools</a></p>`,
  });
}

export function renderBlogFallback(article, articles) {
  const coverImage = article.coverimage
    ? `<figure><img src="${escapeHtml(article.coverimage)}" alt="${escapeHtml(article.imagealt || article.title)}" width="1200" height="630" loading="lazy" /><figcaption>${escapeHtml(article.imagealt || article.title)}</figcaption></figure>`
    : '';
  const metadata = `<p><span>${escapeHtml(article.author || 'ClickPDF Editorial Team')}</span>${article.date ? ` · <time>${escapeHtml(article.date)}</time>` : ''}${article.category ? ` · <span>${escapeHtml(article.category)}</span>` : ''}</p>`;
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
  const content = `<article>${metadata}${coverImage}<p>${escapeHtml(article.summary || article.excerpt || article.seodescription || '')}</p>${renderMarkdownBody(article.body, article.title)}${targetTool}</article>${linkList(relatedPosts, 'Related ClickPDF guides')}<p><a href="/blog/">Browse all ClickPDF guides</a></p>`;
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
    description: 'Practical guides about PDF tools, document privacy, and browser-based workflows.',
    content: `${linkList(articleList, 'ClickPDF guides and articles')}<p><a href="/">Browse all ClickPDF tools</a></p>`,
  });
}

export function renderFaqFallback(faqItems) {
  const content = `<section aria-labelledby="seo-faq-list"><h2 id="seo-faq-list">Questions and answers</h2>${faqItems
    .map((item) => `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`)
    .join('')}</section><p><a href="/">Browse all ClickPDF tools</a></p>`;
  return fallbackPage({
    title: 'Frequently Asked Questions',
    description: 'Answers about ClickPDF privacy, browser processing, PDF tools, limits and compatibility.',
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
    description: 'Process multiple documents sequentially in your browser and download results individually or as a ZIP.',
    content: `<section><h2>How the batch queue works</h2><ol><li><h3>Choose a PDF tool</h3><p>Select a supported PDF utility to run on the documents in your queue.</p></li><li><h3>Add documents</h3><p>Choose the files and settings for the selected tool. Processing limits depend on browser and device resources.</p></li><li><h3>Process and download</h3><p>Review completed results and download the available output files.</p></li></ol></section>${linkList(links, 'Available PDF tools')}`,
  });
}
