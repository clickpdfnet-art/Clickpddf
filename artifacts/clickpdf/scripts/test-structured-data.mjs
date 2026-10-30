import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import sharp from 'sharp';
import { readActiveToolRegistry } from './static-tool-registry.mjs';
import { renderMarkdownBody } from './static-page-content.mjs';
import worker from '../cloudflare-worker.mjs';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(appDir, 'dist', 'public');
const siteOrigin = 'https://www.clickpdf.net';

function decodeXml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function schemaNodes(schema) {
  if (!schema || typeof schema !== 'object') return [];
  return Array.isArray(schema['@graph']) ? schema['@graph'] : [schema];
}

function schemaTypes(nodes) {
  return new Set(nodes.flatMap((node) => {
    const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
    return types.filter((type) => typeof type === 'string');
  }));
}

function pageFileForUrl(value) {
  const pathname = new URL(value).pathname;
  const relative = pathname.replace(/^\/+|\/+$/g, '');
  return path.join(publicDir, relative, 'index.html');
}

async function readHeadSchemas(value) {
  const html = await readFile(pageFileForUrl(value), 'utf8');
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
  assert.ok(head, `Rendered static page has a head element: ${value}`);
  const scripts = [...head.matchAll(/<script\b(?=[^>]*type=["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.ok(scripts.length, `JSON-LD is in the raw HTML head: ${value}`);
  const schemas = scripts.map((match) => {
    try {
      return JSON.parse(match[1]);
    } catch (error) {
      assert.fail(`Invalid JSON-LD on ${value}: ${error.message}`);
    }
  });
  return { html, schemas, nodes: schemas.flatMap(schemaNodes) };
}

function staticMain(html, url) {
  const match = html.match(/<main\b(?=[^>]*\bid=["']seo-static-content["'])[^>]*>([\s\S]*?)<\/main>/i);
  assert.ok(match, `route-specific semantic static content is in the HTML response: ${url}`);
  const headings = match[1].match(/<h1\b/gi) || [];
  assert.equal(headings.length, 1, `static fallback has exactly one H1: ${url}`);
  return match[1];
}

const sitemap = await readFile(path.join(publicDir, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([\s\S]*?)<\/loc>/g)]
  .map((match) => decodeXml(match[1].trim()));
const activeTools = await readActiveToolRegistry(appDir);
const toolUrls = urls.filter((value) => new URL(value).pathname.startsWith('/tools/'));
const blogFiles = (await readdir(path.join(appDir, 'src', 'blogs'))).filter((name) => name.endsWith('.md'));
const supportedBlogLocales = [
  'en', 'ur', 'hi', 'ar', 'zh', 'ja', 'tl', 'de', 'fr', 'es', 'it',
  'no', 'pt', 'ru', 'ko', 'tr', 'nl', 'pl', 'sv', 'id', 'vi',
];
const blogPosts = await Promise.all(blogFiles.map(async (file) => {
  const raw = await readFile(path.join(appDir, 'src', 'blogs', file), 'utf8');
  const frontmatter = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const metadata = Object.fromEntries((frontmatter?.[1] || '').split(/\r?\n/).flatMap((line) => {
    const separator = line.indexOf(':');
    if (separator <= 0) return [];
    const key = line.slice(0, separator).trim().toLowerCase().replace(/[\s_-]+/g, '');
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) value = value.slice(1, -1);
    return [[key, value]];
  }));
  return {
    file,
    metadata,
    body: raw.slice(frontmatter?.[0].length || 0).trim(),
  };
}));
const blogTranslationGroups = new Map();
for (const post of blogPosts) {
  const group = post.metadata.translationgroup;
  if (!group) continue;
  const entries = blogTranslationGroups.get(group) || [];
  entries.push(post);
  blogTranslationGroups.set(group, entries);
}
const expectedLocalizedBlogPageCount = [...blogTranslationGroups.values()]
  .reduce((count, group) => count + group.length, 0);
const expectedBlogAlternateCount = [...blogTranslationGroups.values()]
  .reduce(
    (count, group) =>
      count + group.length * (new Set(group.map((post) => post.metadata.locale || 'en')).size + 1),
    0,
  );
const legalPages = JSON.parse(await readFile(path.join(appDir, 'src', 'data', 'legalPages.json'), 'utf8'));

test('sitemap routes have static metadata and parseable head JSON-LD', async () => {
  assert.equal(new Set(urls).size, urls.length, 'sitemap URLs are unique');
  assert.equal(
    urls.length,
    activeTools.length + blogFiles.length + 10,
    'sitemap includes all tools, all blog routes, and ten shared public routes',
  );
  assert.equal(toolUrls.length, activeTools.length, 'sitemap lists exactly the active public tools');
  for (const tool of activeTools) {
    assert.ok(
      toolUrls.includes(`${siteOrigin}/tools/${tool.slug}/`),
      `public tool route is present in sitemap: ${tool.slug}`,
    );
  }

  for (const url of urls) {
    assert.ok(url.startsWith(`${siteOrigin}/`), `production canonical host is used: ${url}`);
    const { html, nodes } = await readHeadSchemas(url);
    const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1];
    assert.equal(canonical, url, `canonical matches its static route: ${url}`);
    const title = decodeXml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
    const descriptionTag = html.match(
      /<meta\b(?=[^>]*\bname=["']description["'])[^>]*>/i,
    )?.[0] || '';
    const description = decodeXml(
      descriptionTag.match(/\bcontent=(["'])([\s\S]*?)\1/i)?.[2] || '',
    );
    assert.ok(
      Array.from(title).length >= 30 && Array.from(title).length <= 60,
      `${url} has a 30–60 character title (${Array.from(title).length})`,
    );
    assert.ok(
      Array.from(description).length >= 120 && Array.from(description).length <= 158,
      `${url} has a 120–158 character description (${Array.from(description).length})`,
    );
    const ogImage = html.match(/<meta\b[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1];
    const twitterImage = html.match(/<meta\b[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)?.[1];
    const blogPosting = nodes.find((node) => Array.isArray(node['@type']) && node['@type'].includes('BlogPosting'));
    const expectedImage = blogPosting?.image?.[0] || `${siteOrigin}/social/clickpdf-social-1200x630.png`;
    assert.equal(ogImage, expectedImage, `${url} Open Graph image matches the page's article image or site default`);
    assert.equal(twitterImage, ogImage);
    const sourceArticle = blogPosts.find((post) => post.metadata.routepath === new URL(url).pathname);
    const expectedOgWidth = sourceArticle?.metadata.coverwatermark === 'false'
      ? sourceArticle.metadata.coverwidth
      : '1200';
    const expectedOgHeight = sourceArticle?.metadata.coverwatermark === 'false'
      ? sourceArticle.metadata.coverheight
      : '630';
    assert.match(html, new RegExp(`property=["']og:image:width["']\\s+content=["']${expectedOgWidth}["']`, 'i'));
    assert.match(html, new RegExp(`property=["']og:image:height["']\\s+content=["']${expectedOgHeight}["']`, 'i'));
    assert.match(html, /rel=["']icon["'][^>]*href=["']\/favicon\.ico["']/i);
    assert.match(html, /rel=["']apple-touch-icon["'][^>]*href=["']\/apple-touch-icon\.png["']/i);
    assert.match(html, /sizes=["']192x192["'][^>]*href=["']\/icon-192\.png["']/i);
    assert.match(html, /sizes=["']512x512["'][^>]*href=["']\/icon-512\.png["']/i);
    staticMain(html, url);
    assert.match(html, /<div id=["']root["']><\/div>/i, 'React createRoot mount remains empty and unchanged');
  }
});

test('every blog translation group has complete cards and articles in all supported locales', async () => {
  assert.equal(blogTranslationGroups.size, 11, 'all existing translated groups plus the newly translated guide are registered');
  for (const [groupName, group] of blogTranslationGroups) {
    const locales = group.map((post) => post.metadata.locale || 'en').sort();
    assert.equal(group.length, supportedBlogLocales.length, `${groupName} has one entry per supported locale`);
    assert.deepEqual(
      locales,
      [...supportedBlogLocales].sort(),
      `${groupName} covers all supported locales exactly once`,
    );
    const english = group.find((post) => (post.metadata.locale || 'en') === 'en');
    assert.ok(english, `${groupName} has its English source article`);

    for (const post of group) {
      const locale = post.metadata.locale || 'en';
      assert.ok(post.metadata.title, `${post.file} has a localized title`);
      assert.ok(post.metadata.summary, `${post.file} has a localized card excerpt`);
      assert.ok(post.body.length > 0, `${post.file} has full article content`);
      if (locale === 'en') continue;

      assert.notEqual(post.metadata.title, english.metadata.title, `${post.file} card title is translated`);
      assert.notEqual(post.metadata.summary, english.metadata.summary, `${post.file} card excerpt is translated`);
      for (const key of ['category', 'imagealt', 'targettooltitle', 'targettoolcta', 'seokeywords']) {
        assert.ok(post.metadata[key], `${post.file} has localized ${key}`);
        assert.notEqual(post.metadata[key], english.metadata[key], `${post.file} ${key} is translated`);
      }
      assert.notEqual(post.body, english.body, `${post.file} article body is translated`);
      assert.ok(post.metadata.seotitle, `${post.file} has a localized SEO title`);
      assert.ok(post.metadata.seodescription, `${post.file} has a localized SEO description`);
      if (english.metadata.faqitems) {
        const englishFaqs = JSON.parse(english.metadata.faqitems);
        const localizedFaqs = JSON.parse(post.metadata.faqitems || '[]');
        assert.equal(localizedFaqs.length, englishFaqs.length, `${post.file} keeps every FAQ`);
        assert.notDeepEqual(localizedFaqs, englishFaqs, `${post.file} FAQ text is translated`);
      }

      const headingCount = (body) => (body.match(/^#{1,6}\s/gm) || []).length;
      const links = (body) => [...body.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]);
      const codeSpans = (body) => [...body.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
      assert.equal(headingCount(post.body), headingCount(english.body), `${post.file} preserves heading hierarchy`);
      const legacyGuideRoutes = new Set([
        '/how-to-combine-pdfs-for-a-college-assignment/',
        '/merge-handwritten-assignment-photos-into-pdf/',
        '/reduce-pdf-assignment-file-size/',
      ]);
      const localizedLinks = links(post.body);
      const linkTypes = (targets) => targets.map((target) => {
        if (target.startsWith('/blog-assets/')) return `image:${target}`;
        if (target.startsWith('/tools/')) return `tool:${target}`;
        if (target.startsWith('/blog/') || legacyGuideRoutes.has(target)) return 'localized article';
        return `link:${target}`;
      });
      assert.deepEqual(
        linkTypes(localizedLinks),
        linkTypes(links(english.body)),
        `${post.file} preserves linked content while allowing localized article routes`,
      );
      const translatedExamples = codeSpans(post.body);
      assert.equal(
        translatedExamples.length,
        codeSpans(english.body).length,
        `${post.file} preserves the same number of inline examples`,
      );
    }
  }
});

test('localized blog sitemap alternates are repeated in each raw HTML head', async () => {
  const sitemapBlocks = [...sitemap.matchAll(/<url>[\s\S]*?<\/url>/g)].map((match) => match[0]);
  const translatedBlocks = sitemapBlocks.filter((block) => /<xhtml:link\b[^>]*hreflang=/i.test(block));
  assert.equal(
    translatedBlocks.length,
    expectedLocalizedBlogPageCount,
    'every localized article route declares hreflang alternates',
  );

  let alternateCount = 0;
  for (const block of translatedBlocks) {
    const pageUrl = decodeXml(block.match(/<loc>([\s\S]*?)<\/loc>/i)?.[1]?.trim() || '');
    const expected = [...block.matchAll(/<xhtml:link\b[^>]*hreflang="([^"]+)"[^>]*href="([^"]+)"/gi)]
      .map((match) => ({ locale: match[1], url: decodeXml(match[2]) }))
      .sort((a, b) => a.locale.localeCompare(b.locale));
    const { html } = await readHeadSchemas(pageUrl);
    const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
    const actual = [...head.matchAll(/<link\b(?=[^>]*rel=["']alternate["'])[^>]*>/gi)]
      .map((match) => ({
        locale: match[0].match(/\bhreflang=["']([^"']+)["']/i)?.[1] || '',
        url: match[0].match(/\bhref=["']([^"']+)["']/i)?.[1] || '',
      }))
      .sort((a, b) => a.locale.localeCompare(b.locale));

    const group = [...blogTranslationGroups.values()].find((entries) =>
      entries.some((entry) => `${siteOrigin}${entry.metadata.routepath || `/blog/${encodeURIComponent(entry.metadata.slug)}/`}` === pageUrl),
    );
    assert.ok(group, `${pageUrl} belongs to a localized blog group`);
    assert.equal(
      expected.length,
      new Set(group.map((entry) => entry.metadata.locale || 'en')).size + 1,
      `${pageUrl} has one alternate per locale and x-default`,
    );
    assert.ok(expected.some((item) => item.locale === 'x-default'), `${pageUrl} includes sitemap x-default`);
    assert.deepEqual(actual, expected, `${pageUrl} head alternates exactly match sitemap alternates`);
    assert.ok(
      [...head.matchAll(/<link\b(?=[^>]*rel=["']alternate["'])[^>]*>/gi)]
        .every((match) => /id=["']clickpdf-blog-hreflang-/.test(match[0])),
      `${pageUrl} static alternate links are replaceable during SPA navigation`,
    );
    alternateCount += actual.length;
  }
  assert.equal(alternateCount, expectedBlogAlternateCount, 'all localized article pages expose their sitemap alternates in HTML heads');
});

test('homepage contains brand, WebSite, WebApplication, navigation, and the full tool list', async () => {
  const { html, nodes } = await readHeadSchemas(`${siteOrigin}/`);
  const content = staticMain(html, `${siteOrigin}/`);
  assert.match(content, /<h1>Free PDF tools that work in your browser<\/h1>/);
  assert.match(
    content,
    /<p>Convert, compress, merge, and edit PDFs online with free browser-based tools\. Your files are processed in your browser whenever supported, helping keep your documents private\.<\/p>/,
  );
  const types = schemaTypes(nodes);
  for (const required of ['Organization', 'WebSite', 'WebPage', 'WebApplication', 'ItemList', 'SiteNavigationElement', 'FAQPage']) {
    assert.ok(types.has(required), `homepage schema includes ${required}`);
  }
  const organization = nodes.find((node) => node['@type'] === 'Organization' && node.name === 'Click Digital Services');
  const website = nodes.find((node) => node['@type'] === 'WebSite');
  const application = nodes.find((node) => node['@type'] === 'WebApplication');
  assert.equal(organization?.logo?.url, `${siteOrigin}/icon-512.png`);
  assert.equal(organization?.logo?.width, 512);
  assert.equal(website?.image?.url, `${siteOrigin}/icon-512.png`);
  assert.match(application?.description || '', /processed locally in your browser/i);
  assert.match(application?.description || '', /third-party services/i);
  assert.match(
    html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1] || '',
    /processed locally in your browser.*third-party resources/i,
  );
  const toolsList = nodes.find((node) => node['@type'] === 'ItemList' && node['@id'] === `${siteOrigin}/#tools`);
  assert.equal(toolsList?.numberOfItems, activeTools.length);
  assert.equal(toolsList?.itemListElement?.length, activeTools.length);
  assert.equal((content.match(/<a href="\/tools\//g) || []).length, activeTools.length);
  assert.match(content, /<section aria-labelledby="seo-home-faq"><h2 id="seo-home-faq">Frequently asked questions<\/h2>/);
  assert.ok((content.match(/<details><summary>/g) || []).length > 0, 'homepage FAQ answers are visible in static HTML');
});

test('each active PDF tool has SoftwareApplication, HowTo, FAQPage, and BreadcrumbList schemas', async () => {
  assert.equal(activeTools.length, 21, 'the public registry covers all 21 active PDF tools');
  const allFaqQuestions = activeTools.flatMap((tool) => tool.faqs.map((faq) => faq.question.trim().toLocaleLowerCase()));
  assert.equal(allFaqQuestions.length, 126, 'the 21 tools provide six FAQs each');
  assert.equal(new Set(allFaqQuestions).size, 126, 'all tool FAQ questions are distinct');
  const howToSignatures = activeTools.map((tool) =>
    tool.steps.map((step) => `${step.title}: ${step.description}`).join(' | ').toLocaleLowerCase(),
  );
  assert.equal(howToSignatures.length, 21, 'each active tool has a HowTo collection');
  assert.equal(new Set(howToSignatures).size, 21, 'HowTo collections are not reused across tools');

  for (const url of toolUrls) {
    const { html, nodes } = await readHeadSchemas(url);
    const content = staticMain(html, url);
    assert.doesNotMatch(
      content,
      /href=["']\/tools\/(?:protect-pdf|pdf-metadata)(?:\/|["'?#])/i,
      `${url} does not publish stale Protect PDF or metadata routes`,
    );
    const types = schemaTypes(nodes);
    for (const required of ['SoftwareApplication', 'WebApplication', 'HowTo', 'FAQPage', 'BreadcrumbList']) {
      assert.ok(types.has(required), `${url} schema includes ${required}`);
    }
    assert.match(content, /<section[\s\S]*?<ol>/i, `${url} includes semantic how-to steps`);
    assert.match(content, /Frequently asked questions/i, `${url} includes visible FAQ text`);
    const slug = new URL(url).pathname.split('/').filter(Boolean).at(-1);
    const tool = activeTools.find((item) => item.slug === slug);
    assert.ok(tool, `active tool registry includes ${url}`);
    const staticDescription = html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1] || '';
    assert.equal(decodeXml(staticDescription), tool.description, `${url} uses its registry description in static HTML`);
    const howTo = nodes.find((node) => node['@type'] === 'HowTo');
    assert.equal(howTo?.step?.length, tool.steps.length, `${url} schema has every workflow step`);
    assert.equal(howTo?.step?.length, 3, `${url} HowTo uses the requested three-step workflow`);
    assert.ok(howTo?.step?.every((step) => step.name && step.text), `${url} has readable HowTo step names and text`);
    assert.deepEqual(
      howTo?.step?.map((step) => ({ title: step.name, description: step.text })),
      tool.steps.map((step) => ({ title: step.title, description: step.description })),
      `${url} visible HowTo copy matches its JSON-LD steps`,
    );
    const expectedFaqCount = 6;
    assert.equal(tool.faqs.length, expectedFaqCount, `${url} has six tool-specific FAQs`);
    assert.equal(new Set(tool.faqs.map((faq) => faq.question.trim().toLocaleLowerCase())).size, expectedFaqCount, `${url} has no repeated FAQ questions`);
    assert.equal((content.match(/<details>/g) || []).length, expectedFaqCount, `${url} visibly renders the same FAQs`);
    const faqSchema = nodes.find((node) => node['@type'] === 'FAQPage');
    assert.deepEqual(faqSchema?.mainEntity?.map((item) => ({
      question: item.name,
      answer: item.acceptedAnswer?.text,
    })), tool.faqs, `${url} visible FAQ data is mirrored by its JSON-LD FAQPage`);
    const visibleText = decodeXml(content.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ');
    for (const faq of tool.faqs) {
      assert.ok(visibleText.includes(faq.question), `${url} visibly includes FAQ question: ${faq.question}`);
      assert.ok(visibleText.includes(faq.answer), `${url} visibly includes the answer for: ${faq.question}`);
    }
    for (const step of tool.steps) {
      assert.ok(visibleText.includes(step.title), `${url} visibly includes HowTo step: ${step.title}`);
      assert.ok(visibleText.includes(step.description), `${url} visibly includes HowTo description: ${step.title}`);
    }
    const answerStart = content.indexOf('<section aria-label="Quick answer"');
    const howToStart = content.indexOf('id="seo-tool-steps"');
    assert.ok(answerStart >= 0 && howToStart > answerStart, `${url} has a quick answer before the How-To section`);
    const answerBlock = content.slice(answerStart, howToStart);
    assert.match(answerBlock, /Use .+ to .+\./i, `${url} quick answer describes the tool action`);
    assert.match(answerBlock, /processed locally in your browser/i, `${url} quick answer describes local processing`);
    assert.match(answerBlock, /device memory/i, `${url} quick answer describes practical device limits`);
    const orderedSteps = howTo?.step || [];
    assert.match(`${orderedSteps[0]?.name} ${orderedSteps[0]?.text}`, /select|upload|drop|choose|open|add/i, `${url} starts by selecting files`);
    assert.match(`${orderedSteps[2]?.name} ${orderedSteps[2]?.text}`, /download|save|copy|export|generate|create/i, `${url} ends with an output action`);
  }
});

test('blog posts, blog index, FAQ, and batch routes have page-specific static schemas', async () => {
  let blogPostPages = 0;
  for (const url of urls) {
    const { html, nodes } = await readHeadSchemas(url);
    const content = staticMain(html, url);
    const types = schemaTypes(nodes);
    if (types.has('BlogPosting')) {
      blogPostPages += 1;
      assert.ok(types.has('Article'), `${url} includes Article`);
      assert.ok(types.has('BreadcrumbList'), `${url} includes BreadcrumbList`);
      assert.match(content, /<article>/i, `${url} contains semantic article body`);
      assert.match(
        content,
        /<article><aside aria-labelledby="blog-quick-answer-heading"[^>]*>[\s\S]*?<h2 id="blog-quick-answer-heading"[^>]*>[^<]+<\/h2><p\b[^>]*>[^<]+<\/p><\/aside>/i,
        `${url} starts its article with a clearly labeled Quick Answer callout`,
      );
      assert.match(content, /<h2\b/i, `${url} contains semantic section headings`);
      assert.match(content, /<a href=/i, `${url} contains crawlable article links`);
      const posting = nodes.find((node) => Array.isArray(node['@type']) && node['@type'].includes('BlogPosting'));
      assert.equal(posting?.publisher?.logo?.url, `${siteOrigin}/icon-512.png`, `${url} publisher uses the official logo`);
      const featuredImage = content.match(/<figure><img src="([^"]+)"/i)?.[1];
      const article = blogPosts.find((post) => post.metadata.routepath === new URL(url).pathname);
      if (article?.metadata.coverwatermark === 'false') {
        assert.equal(featuredImage, article.metadata.coverimage, `${url} keeps its approved cover image unwatermarked`);
      } else {
        assert.match(featuredImage || '', /^\/blog-assets\/watermarked\/[a-f0-9]{20}\.webp$/, `${url} uses a permanently watermarked featured image`);
      }
      assert.ok(
        posting?.image?.some((image) => image === `${siteOrigin}${featuredImage}`),
        `${url} structured data references its watermarked featured image`,
      );
    }
    if (new URL(url).pathname === '/blog/') {
      assert.ok(types.has('CollectionPage'));
      assert.ok(types.has('ItemList'));
      assert.ok(types.has('BreadcrumbList'));
    }
    if (new URL(url).pathname === '/faq/') {
      assert.ok(types.has('FAQPage'));
      assert.ok(types.has('BreadcrumbList'));
    }
    if (new URL(url).pathname === '/batch/') {
      assert.ok(types.has('WebApplication'));
      assert.ok(types.has('BreadcrumbList'));
    }
  }
  assert.equal(blogPostPages, blogFiles.length, 'every Markdown blog post has static BlogPosting data');

  const homePage = await readHeadSchemas(`${siteOrigin}/`);
  const faqPage = await readHeadSchemas(`${siteOrigin}/faq/`);
  const homeFaq = homePage.nodes.find((node) => node['@type'] === 'FAQPage');
  const routeFaq = faqPage.nodes.find((node) => node['@type'] === 'FAQPage');
  assert.deepEqual(homeFaq?.mainEntity, routeFaq?.mainEntity, 'homepage and /faq/ JSON-LD contain the exact same questions and answers');
  const homepageFaqContent = staticMain(homePage.html, `${siteOrigin}/`);
  const faqRouteContent = staticMain(faqPage.html, `${siteOrigin}/faq/`);
  for (const item of routeFaq?.mainEntity || []) {
    assert.ok(homepageFaqContent.includes(`<summary>${escapeHtml(item.name)}</summary>`), 'each schema question is visible on homepage');
    assert.ok(homepageFaqContent.includes(`<p>${escapeHtml(item.acceptedAnswer.text)}</p>`), 'each schema answer is visible on homepage');
    assert.ok(faqRouteContent.includes(`<summary>${escapeHtml(item.name)}</summary>`), 'each schema question is visible on /faq/');
    assert.ok(faqRouteContent.includes(`<p>${escapeHtml(item.acceptedAnswer.text)}</p>`), 'each schema answer is visible on /faq/');
  }
});

test('all policy and company pages are standalone sitemap routes with accurate schemas', async () => {
  assert.equal(legalPages.length, 6);
  for (const page of legalPages) {
    const url = `${siteOrigin}${page.path}`;
    assert.ok(urls.includes(url), `${page.path} is present in the sitemap`);
    const { html, nodes } = await readHeadSchemas(url);
    const types = schemaTypes(nodes);
    const content = staticMain(html, url);
    assert.ok(types.has(page.schemaType), `${url} includes ${page.schemaType}`);
    assert.ok(types.has('BreadcrumbList'), `${url} includes BreadcrumbList`);
    assert.ok(content.includes(`<h1>${page.heading}</h1>`), `${url} renders its visible heading`);
    for (const otherPage of legalPages.filter((candidate) => candidate.id !== page.id)) {
      assert.ok(content.includes(`href="${otherPage.path}"`), `${url} links to ${otherPage.path}`);
    }
    if (page.contactEmail) {
      assert.ok(content.includes(`mailto:${page.contactEmail}`), `${url} has the published support email`);
    }
  }
});

test('all sitemap URLs resolve to generated static HTML files', async () => {
  for (const url of urls) {
    await access(pageFileForUrl(url));
  }
});

test('robots, llms.txt, and the social image are generated for production', async () => {
  const robots = await readFile(path.join(publicDir, 'robots.txt'), 'utf8');
  const llms = await readFile(path.join(publicDir, 'llms.txt'), 'utf8');
  const llmsFull = await readFile(path.join(publicDir, 'llms-full.txt'), 'utf8');
  const toolsSection = llms.split('## PDF tools\n')[1]?.split('\n## ')[0] || '';
  const guidesSection = llms.split('## Guides and articles\n')[1]?.split('\n## ')[0] || '';
  const otherPagesSection = llms.split('## Other pages\n')[1]?.split('\n## ')[0] || '';
  const machineIndexesSection = llms.split('## Machine-readable indexes\n')[1]?.split('\n## ')[0] || '';
  const fullToolsSection = llmsFull.split('## PDF tools\n')[1]?.split('\n## ')[0] || '';
  const fullGuidesSection = llmsFull.split('## Guides and articles\n')[1]?.split('\n## ')[0] || '';
  const fullPagesSection = llmsFull.split('## Other public pages\n')[1]?.split('\n## ')[0] || '';
  const fullIndexesSection = llmsFull.split('## Machine-readable indexes\n')[1]?.split('\n## ')[0] || '';
  assert.match(robots, /Sitemap:\s*https:\/\/www\.clickpdf\.net\/sitemap_index\.xml/i);
  assert.doesNotMatch(robots, /^Sitemap:\s*https:\/\/www\.clickpdf\.net\/sitemap\.xml\s*$/im);
  assert.match(robots, /https:\/\/www\.clickpdf\.net\/llms\.txt/i);
  assert.match(llms, /document file contents are processed locally in your browser/i);
  assert.match(llms, /standard network requests/i);
  assert.match(llms, /advertising or other third-party features/i);
  assert.match(machineIndexesSection, new RegExp(`\\[Canonical homepage\\]\\(${siteOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/\\)`));
  assert.match(machineIndexesSection, new RegExp(`\\[XML sitemap\\]\\(${siteOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/sitemap\\.xml\\)`));
  assert.match(machineIndexesSection, new RegExp(`\\[Full site guide for language models\\]\\(${siteOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/llms-full\\.txt\\)`));
  assert.equal(
    (toolsSection.match(/^- \[/gm) || []).length,
    activeTools.length,
    'llms.txt contains every active public tool',
  );
  assert.equal(
    (guidesSection.match(/^- \[/gm) || []).length,
    blogFiles.length,
    'llms.txt contains every Markdown article',
  );
  for (const page of legalPages) {
    assert.ok(otherPagesSection.includes(`${siteOrigin}${page.path}`), `llms.txt includes ${page.path}`);
  }
  assert.match(llmsFull, /^# ClickPDF — Full Site Guide/m, 'llms-full.txt is a real text guide rather than SPA HTML');
  assert.doesNotMatch(llmsFull, /<!doctype html|<html\b/i, 'llms-full.txt contains no HTML fallback document');
  assert.equal(
    (fullToolsSection.match(/^### /gm) || []).length,
    activeTools.length,
    'llms-full.txt has an expanded entry for every active public tool',
  );
  for (const tool of activeTools) {
    assert.ok(
      fullToolsSection.includes(`${siteOrigin}/tools/${tool.slug}/`),
      `llms-full.txt includes the canonical tool URL for ${tool.slug}`,
    );
  }
  assert.equal(
    (fullGuidesSection.match(/^- \[/gm) || []).length,
    blogFiles.length,
    'llms-full.txt includes every Markdown article',
  );
  assert.match(llmsFull, /document file contents are processed locally in your browser/i);
  assert.match(llmsFull, /standard network requests/i);
  assert.match(llmsFull, /enabled advertising or other third-party features/i);
  assert.doesNotMatch(fullToolsSection, /\[object Object\]/, 'llms-full.txt renders How-To steps as readable text');
  for (const tool of activeTools) {
    assert.ok(
      fullToolsSection.includes(`${siteOrigin}/tools/${tool.slug}/`),
      `llms-full.txt includes the canonical tool URL for ${tool.slug}`,
    );
    assert.ok(
      tool.faqs.every((faq) => fullToolsSection.includes(faq.question)),
      `llms-full.txt lists the three visible FAQs for ${tool.slug}`,
    );
  }
  for (const page of legalPages) {
    assert.ok(fullPagesSection.includes(`${siteOrigin}${page.path}`), `llms-full.txt includes ${page.path}`);
  }
  assert.match(fullIndexesSection, new RegExp(`Canonical homepage: ${siteOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/`));
  assert.match(fullIndexesSection, new RegExp(`XML sitemap: ${siteOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/sitemap\\.xml`));
  assert.match(fullIndexesSection, new RegExp(`Short LLM index: ${siteOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/llms\\.txt`));
  await access(path.join(publicDir, 'social', 'clickpdf-social-1200x630.png'));
  const manifest = JSON.parse(await readFile(path.join(publicDir, 'manifest.json'), 'utf8'));
  assert.ok(manifest.icons.some((icon) => icon.src === '/icon-192.png'));
  assert.ok(manifest.icons.some((icon) => icon.src === '/icon-512.png'));
  const serviceWorker = await readFile(path.join(publicDir, 'sw.js'), 'utf8');
  assert.match(serviceWorker, /clickpdf-v5/);
  assert.match(serviceWorker, /AD_ASSET_PATHS/);
  assert.match(serviceWorker, /event\.respondWith\(fetch\(request\)\)/);
  assert.match(serviceWorker, /icon-192\.png/);
  assert.match(serviceWorker, /icon-512\.png/);
  for (const [fileName, width, height] of [
    ['icon-192.png', 192, 192],
    ['icon-512.png', 512, 512],
    ['apple-touch-icon.png', 180, 180],
    ['social/clickpdf-social-1200x630.png', 1200, 630],
  ]) {
    const image = await readFile(path.join(publicDir, fileName));
    assert.equal(image.readUInt32BE(16), width, `${fileName} width`);
    assert.equal(image.readUInt32BE(20), height, `${fileName} height`);
  }
  const favicon = await readFile(path.join(publicDir, 'favicon.ico'));
  assert.equal(favicon.readUInt16LE(0), 0);
  assert.equal(favicon.readUInt16LE(2), 1);
});

test('each unique blog cover follows its watermark policy and has a valid public image', async () => {
  const watermarkMap = JSON.parse(await readFile(path.join(appDir, 'src', 'data', 'blogWatermarkMap.json'), 'utf8'));
  const sitemap = await readFile(path.join(publicDir, 'sitemap.xml'), 'utf8');
  assert.ok(Object.keys(watermarkMap).length >= 9, 'all current unique covers, including the fallback, are mapped');
  const unwatermarkedSources = new Set(
    blogPosts
      .filter((post) => post.metadata.coverwatermark === 'false')
      .map((post) => post.metadata.coverimage),
  );

  for (const [source, publicPath] of Object.entries(watermarkMap)) {
    assert.ok(source.startsWith('/') || source.startsWith('https://'), `${source} is a local path or HTTPS image`);
    if (unwatermarkedSources.has(source)) {
      assert.equal(publicPath, source, `${source} remains unwatermarked by request`);
    } else {
      assert.match(publicPath, /^\/blog-assets\/watermarked\/[a-f0-9]{20}\.webp$/);
    }
    const imagePath = path.join(publicDir, publicPath.slice(1));
    const image = await readFile(imagePath);
    const metadata = await sharp(image).metadata();
    if (unwatermarkedSources.has(source)) {
      assert.ok(['jpeg', 'png', 'webp'].includes(metadata.format || ''), `${publicPath} is a supported image`);
      assert.ok(metadata.width && metadata.height, `${publicPath} has readable dimensions`);
    } else {
      assert.equal(metadata.format, 'webp', `${publicPath} is an actual WebP image`);
      assert.equal(metadata.width, 1200, `${publicPath} width`);
      assert.equal(metadata.height, 630, `${publicPath} height`);
    }
    assert.ok(sitemap.includes(`${siteOrigin}${publicPath}`), `${publicPath} appears in the image sitemap`);
  }
});

test('Cloudflare worker resolves percent-encoded Unicode blog routes to their own static pages', async () => {
  const routeMap = JSON.parse(await readFile(path.join(publicDir, '__unicode_routes.json'), 'utf8'));
  assert.ok(Object.keys(routeMap).length >= 5, 'localized non-Latin blog routes are mapped');

  for (const [decodedPath, routeAssetPath] of Object.entries(routeMap)) {
    const request = new Request(new URL(decodedPath, siteOrigin));
    const env = {
      ASSETS: {
        async fetch(assetRequest) {
          const assetUrl = new URL(assetRequest.url);
          const requestedPath = assetUrl.pathname.replace(/^\/+/, '');
          if (requestedPath.startsWith('__unicode_routes__/') && requestedPath.endsWith('.html')) {
            return Response.redirect(
              new URL(requestedPath.slice(0, -5), assetUrl.origin),
              307,
            );
          }
          const relativePath = requestedPath.startsWith('__unicode_routes__/')
            ? `${requestedPath}.html`
            : requestedPath;
          try {
            const body = await readFile(path.join(publicDir, relativePath));
            return new Response(body, {
              status: 200,
              headers: { 'content-type': assetUrl.pathname.endsWith('.json') ? 'application/json' : 'text/html; charset=utf-8' },
            });
          } catch {
            return new Response('Not found', { status: 404 });
          }
        },
      },
    };
    const response = await worker.fetch(request, env);
    const html = await response.text();
    const expectedCanonical = new URL(decodedPath, siteOrigin).href;
    assert.equal(response.status, 200, `${decodedPath} resolves`);
    assert.match(html, new RegExp(`<link rel="canonical" href="${expectedCanonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
    assert.match(html, /<main id="seo-static-content"/);
    assert.doesNotMatch(html, /<h1>Stay Secure, Stay Smart<\/h1>/);
    assert.ok(routeAssetPath.startsWith('/__unicode_routes__/'));
  }
});

test('all public routes keep localized heads, verified article metadata, headings, and image dimensions', async () => {
  assert.equal(
    urls.length,
    activeTools.length + blogFiles.length + 10,
    'sitemap includes all tools, all blog posts, and ten shared public routes',
  );

  const expectedPersonAuthors = new Set(['Sarah Jenkins', 'Khurram Shah', 'Asad Tariq']);
  let articleCount = 0;
  for (const url of urls) {
    const { html, nodes } = await readHeadSchemas(url);
    const posting = nodes.find((node) =>
      Array.isArray(node['@type']) && node['@type'].includes('BlogPosting'),
    );
    if (!posting) continue;
    articleCount += 1;

    assert.ok(posting.datePublished, `${url} has datePublished`);
    assert.ok(posting.dateModified, `${url} has dateModified`);
    assert.ok(
      new Date(posting.dateModified).getTime() >= new Date(posting.datePublished).getTime(),
      `${url} modification date does not precede publication`,
    );
    const language = posting.inLanguage || 'en';
    assert.match(html, new RegExp(`<html\\b[^>]*\\blang=["']${language}["']`, 'i'), `${url} root language matches its article`);

    const content = staticMain(html, url);
    const headingLevels = [...content.matchAll(/<h([1-6])\b/gi)].map((match) => Number(match[1]));
    assert.equal(headingLevels.filter((level) => level === 1).length, 1, `${url} has one H1`);
    for (let index = 1; index < headingLevels.length; index += 1) {
      assert.ok(
        headingLevels[index] <= headingLevels[index - 1] + 1,
        `${url} heading hierarchy does not skip from H${headingLevels[index - 1]} to H${headingLevels[index]}`,
      );
    }

    for (const imageTag of content.matchAll(/<img\b[^>]*>/gi)) {
      assert.match(imageTag[0], /\bwidth=["']\d+["']/i, `${url} image has intrinsic width`);
      assert.match(imageTag[0], /\bheight=["']\d+["']/i, `${url} image has intrinsic height`);
    }

    const authorName = posting.author?.name || '';
    const expectedAuthorType = expectedPersonAuthors.has(authorName) ? 'Person' : 'Organization';
    assert.equal(posting.author?.['@type'], expectedAuthorType, `${url} author type reflects a person or publishing organization`);
  }
  assert.equal(articleCount, blogFiles.length, 'every Markdown article page has BlogPosting schema');

  const home = staticMain((await readHeadSchemas(`${siteOrigin}/`)).html, `${siteOrigin}/`);
  const footerSource = await readFile(path.join(appDir, 'src', 'components', 'Footer.tsx'), 'utf8');
  const blogSectionSource = await readFile(
    path.join(appDir, 'src', 'components', 'BlogSection.tsx'),
    'utf8',
  );
  const standaloneArticleSource = await readFile(
    path.join(appDir, 'src', 'components', 'ReducePdfAssignmentArticle.tsx'),
    'utf8',
  );
  const dateFormattingSource = await readFile(
    path.join(appDir, 'src', 'utils', 'formatLocalizedDate.ts'),
    'utf8',
  );
  for (const page of legalPages) {
    assert.ok(home.includes(`href="${page.path}"`), `homepage raw HTML links to ${page.path}`);
    assert.ok(
      footerSource.includes(`buildAppPath('${page.path}')`),
      `website footer has a canonical anchor to ${page.path}`,
    );
  }
  assert.match(footerSource, /handleLegalLink\(event,\s*'(?:about|contact|cookies|privacy|terms)'\)/);
  assert.match(footerSource, /event\.preventDefault\(\);\s*onOpenLegal\(tab\)/);
  assert.match(blogSectionSource, /toolUrl = '\/tools\/protect-pdf-password\/'/);
  assert.match(blogSectionSource, /toolUrl = '\/tools\/ocr-pdf-analysis\/'/);
  assert.doesNotMatch(blogSectionSource, /toolUrl = '\/tools\/(?:protect-pdf|pdf-metadata)(?:\/|')/);
  assert.match(blogSectionSource, /post\.locale === \(hasCurrentLocale \? language : 'en'\)/);
  assert.match(blogSectionSource, /formatLocalizedDate\(post\.date,\s*post\.locale \|\| language\)/);
  assert.match(blogSectionSource, /formatLocalizedReadTime\(post\.readTime,\s*post\.locale \|\| language\)/);
  assert.match(blogSectionSource, /formatLocalizedByline\(activeArticle\.author,\s*activeArticle\.locale \|\| language\)/);
  assert.match(standaloneArticleSource, /formatLocalizedDate\(article\.date,\s*article\.locale \|\| 'en'\)/);
  assert.match(standaloneArticleSource, /formatLocalizedReadTime\(article\.readTime,\s*article\.locale \|\| 'en'\)/);
  assert.match(standaloneArticleSource, /formatLocalizedByline\(article\.author,\s*article\.locale \|\| 'en'\)/);
  for (const locale of supportedBlogLocales) {
    assert.ok(
      dateFormattingSource.includes(`${locale}: (minutes) =>`),
      `blog dates and reading labels support ${locale}`,
    );
  }

  const llms = await readFile(path.join(publicDir, 'llms.txt'), 'utf8');
  const llmsFull = await readFile(path.join(publicDir, 'llms-full.txt'), 'utf8');
  assert.doesNotMatch(
    `${llms}\n${llmsFull}`,
    /selected files are processed locally in the browser instead of being uploaded/i,
    'machine-readable descriptions do not contain the previous awkward replacement phrase',
  );
});

test('blog tool links render with canonical root-relative paths across localized static pages', async () => {
  const blogHtmlFiles = [];
  async function collectHtmlFiles(directory) {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) await collectHtmlFiles(entryPath);
      else if (entry.isFile() && entry.name.endsWith('.html')) blogHtmlFiles.push(entryPath);
    }
  }

  await collectHtmlFiles(path.join(publicDir, 'blog'));
  await collectHtmlFiles(path.join(publicDir, '__unicode_routes__'));
  assert.ok(blogHtmlFiles.length > 0, 'generated blog HTML pages exist');

  const invalidHomeLink = /href=["'](?:http:\/\/(?:www\.)?clickpdf\.net\/?|https:\/\/clickpdf\.net\/?)(?:["'#?])/i;
  for (const file of blogHtmlFiles) {
    const html = await readFile(file, 'utf8');
    assert.doesNotMatch(html, invalidHomeLink, `${file} uses HTTPS for homepage links`);
    const hrefs = [...html.matchAll(/<a\b[^>]*\bhref=(["'])(.*?)\1/gi)].map((match) => match[2]);
    for (const href of hrefs) {
      if (href.includes('/tools/image-to-pdf')) {
        assert.equal(href, '/tools/image-to-pdf/', `${file} uses the canonical Image to PDF path`);
      }
      if (href.includes('/tools/compress-pdf')) {
        assert.equal(href, '/tools/compress-pdf/', `${file} uses the canonical Compress PDF path`);
      }
    }
  }

  const rendered = renderMarkdownBody(
    '[Homepage](http://clickpdf.net) [Image tool](https://clickpdf.net/tools/image-to-pdf) and [compress tool](/tools/compress-pdf)',
    'Canonical link test',
  );
  assert.match(rendered, /href="https:\/\/www\.clickpdf\.net\/"/);
  assert.match(rendered, /href="\/tools\/image-to-pdf\/"/);
  assert.match(rendered, /href="\/tools\/compress-pdf\/"/);
});

test('blog source URLs and CTA targets use canonical internal destinations', async () => {
  const blogSourceDir = path.join(appDir, 'src', 'blogs');
  const blogFiles = (await readdir(blogSourceDir))
    .filter((name) => name.endsWith('.md'))
    .map((name) => path.join(blogSourceDir, name));
  const relevantComponents = [
    path.join(appDir, 'src', 'components', 'BlogSection.tsx'),
    path.join(appDir, 'src', 'components', 'ReducePdfAssignmentArticle.tsx'),
  ];
  const sourceFiles = [...blogFiles, ...relevantComponents];
  const invalidPatterns = [
    {
      pattern: /http:\/\/(?:www\.)?clickpdf\.net/i,
      label: 'legacy HTTP homepage links',
    },
    {
      pattern: /https:\/\/clickpdf\.net/i,
      label: 'non-canonical HTTPS homepage links',
    },
    {
      pattern: /https?:\/\/(?:www\.)?clickpdf\.net\/tools\/(?:image-to-pdf|compress-pdf)/i,
      label: 'absolute tool links',
    },
    {
      pattern: /\/tools\/image-to-pdf(?!\/)/i,
      label: 'Image-to-PDF paths without a trailing slash',
    },
    {
      pattern: /\/tools\/compress-pdf(?!\/)/i,
      label: 'Compress-PDF paths without a trailing slash',
    },
  ];

  for (const file of sourceFiles) {
    const source = await readFile(file, 'utf8');
    for (const { pattern, label } of invalidPatterns) {
      assert.doesNotMatch(source, pattern, `${file} has no ${label}`);
    }
  }
});

test('Edit PDF Metadata copy and static SEO stay within the six supported fields', async () => {
  const url = `${siteOrigin}/tools/edit-pdf-metadata/`;
  const tool = activeTools.find((item) => item.id === 'edit-metadata');
  assert.ok(tool, 'Edit PDF Metadata remains in the active public tool registry');
  assert.equal(tool.name, 'Edit PDF Metadata Online — Update Supported Fields');
  assert.equal(tool.title, 'Edit PDF Metadata Online: Title & Author | ClickPDF');
  assert.equal(
    tool.description,
    'Edit PDF metadata online: update or clear Title, Author, Subject, Keywords, Creator, and Producer. Other metadata and visible page content may remain.',
  );
  assert.equal(
    tool.keywords,
    'edit PDF metadata online, edit PDF properties online, change PDF author, edit PDF title metadata',
  );
  assert.equal(tool.badge, 'PDF Property Editor');
  assert.equal(tool.overviewHeading, 'Inspect or Edit Supported PDF Properties');
  assert.equal(tool.faqs.length, 6, 'all six metadata-specific FAQs reach static output');

  const { html, nodes } = await readHeadSchemas(url);
  const title = decodeXml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
  assert.equal(title, tool.title, 'static title tag matches source SEO title');
  const metaContent = (name) => {
    const tag = html.match(new RegExp(`<meta\\b(?=[^>]*\\bname=["']${name}["'])[^>]*>`, 'i'))?.[0] || '';
    return decodeXml(tag.match(/\bcontent=(["'])([\s\S]*?)\1/i)?.[2] || '');
  };
  assert.equal(metaContent('description'), tool.description);
  assert.equal(metaContent('keywords'), tool.keywords);

  const body = staticMain(html, url);
  for (const phrase of [
    tool.name,
    tool.badge,
    tool.overviewHeading,
    tool.overview,
    tool.secondaryOverview,
    ...tool.steps.map((step) => step.description),
    ...tool.benefits.flatMap((benefit) => [benefit.title, benefit.desc]),
    ...tool.faqs.flatMap((faq) => [faq.question, faq.answer]),
  ]) {
    assert.ok(body.includes(escapeHtml(phrase)), `static page includes current copy: ${phrase}`);
  }
  assert.doesNotMatch(
    `${tool.overview} ${tool.secondaryOverview} ${tool.benefits.map((benefit) => `${benefit.title} ${benefit.desc}`).join(' ')}`,
    /anonymi[sz]|purge all metadata|wipe all metadata|complete metadata scrub|SEO keyword stamping|optimize PDFs for search engines/i,
  );
  const schemaFaq = nodes.find((node) => node['@type'] === 'FAQPage');
  assert.equal(schemaFaq?.mainEntity?.length, 6, 'static FAQ structured data matches the six visible FAQs');
  assert.deepEqual(
    schemaFaq.mainEntity.map((item) => item.name),
    tool.faqs.map((item) => item.question),
  );

  const editorSource = await readFile(path.join(appDir, 'src', 'components', 'MetadataEditorPanel.tsx'), 'utf8');
  const inspectorSource = await readFile(path.join(appDir, 'src', 'components', 'MetadataInspector.tsx'), 'utf8');
  assert.match(editorSource, /Clear Supported Metadata Fields/);
  assert.match(editorSource, /Clear Supported Fields in All PDFs/);
  assert.match(inspectorSource, /Clear Supported Metadata Fields/);
  assert.match(inspectorSource, /Clearing supported fields…/);
  assert.match(inspectorSource, /Downloaded a copy with the supported PDF metadata fields cleared\. This does not make the PDF anonymous\./);
  assert.match(inspectorSource, /Download a technical report or clear the supported PDF metadata fields listed by this tool\./);
});

test('legacy tool links redirect to canonical tools and unknown tool paths return a true 404', async () => {
  const env = {
    ASSETS: {
      async fetch(assetRequest) {
        const path = new URL(assetRequest.url).pathname;
        const canonicalPath = path === '/tools/merge-pdf/'
          ? '/tools/merge-pdf/'
          : '/';
        return new Response(
          `<html><head><link rel="canonical" href="${siteOrigin}${canonicalPath}" /></head></html>`,
          { headers: { 'content-type': 'text/html; charset=utf-8' } },
        );
      },
    },
  };

  const known = await worker.fetch(new Request(`${siteOrigin}/tools/merge-pdf/`), env);
  assert.equal(known.status, 200, 'valid tool route continues to its static page');

  const unknown = await worker.fetch(new Request(`${siteOrigin}/tools/not-a-real-tool/`), env);
  assert.equal(unknown.status, 404, 'SPA fallback is not served as a false tool page');
  assert.match(unknown.headers.get('content-type') || '', /text\/plain/i);
  assert.match(unknown.headers.get('x-robots-tag') || '', /noindex/i);

  const oldProtectRoute = await worker.fetch(new Request(`${siteOrigin}/tools/protect-pdf/`), env);
  assert.equal(oldProtectRoute.status, 301);
  assert.equal(oldProtectRoute.headers.get('location'), `${siteOrigin}/tools/protect-pdf-password/`);

  const oldMetadataRoute = await worker.fetch(new Request(`${siteOrigin}/tools/pdf-metadata/`), env);
  assert.equal(oldMetadataRoute.status, 301);
  assert.equal(oldMetadataRoute.headers.get('location'), `${siteOrigin}/tools/edit-pdf-metadata/`);

  const slashless = await worker.fetch(new Request(`${siteOrigin}/tools/merge-pdf`), env);
  assert.equal(slashless.status, 301);
  assert.equal(slashless.headers.get('location'), `${siteOrigin}/tools/merge-pdf/`);
});
