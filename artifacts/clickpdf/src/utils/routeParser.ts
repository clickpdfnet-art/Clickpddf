import { PDF_TOOLS } from '../data/toolsData';
import { getToolSeoInfo } from '../data/toolSeoData';

const BASE_PATH = import.meta.env.BASE_URL;

function stripBasePath(pathname: string): string {
  const basePrefix = BASE_PATH === '/' ? '' : BASE_PATH.replace(/\/$/, '');
  const appPath = basePrefix && pathname.startsWith(`${basePrefix}/`)
    ? pathname.slice(basePrefix.length)
    : pathname === basePrefix
      ? '/'
      : pathname;
  return appPath.replace(/\/+$/, '') || '/';
}

export function buildAppPath(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (BASE_PATH === '/') return normalizedPath;
  const basePrefix = BASE_PATH.replace(/\/$/, '');
  return normalizedPath === '/' ? `${basePrefix}/` : `${basePrefix}${normalizedPath}`;
}

export interface ParsedRoute {
  view: 'home' | 'tool' | 'blog' | 'batch' | 'faq';
  toolId?: string;
  articleSlug?: string;
  isSitemapModalOpen?: boolean;
}

/**
 * Universal client-side route parser for SPA architecture.
 * Supports:
 * - Dedicated pathnames: /tools/:toolSlug (e.g. /tools/merge-pdf), /blog/:slug, /faq, /batch
 * - Hash routing: #/tools/:toolSlug, #merge-pdf, #faq, #batch
 * - Search query parameters: ?tool=merge, ?article=slug, ?view=blog
 */
export function parseCurrentRoute(): ParsedRoute {
  if (typeof window === 'undefined') {
    return { view: 'home' };
  }

  const pathname = stripBasePath(window.location.pathname);
  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  const search = window.location.search;
  const params = new URLSearchParams(search);

  // GitHub Pages SPA 404 redirect fallback (?/tools/... or ?/blog/...)
  let effectivePathname = pathname;
  if (search && search[1] === '/') {
    const extracted = search.slice(1).split('&')[0].replace(/~and~/g, '&');
    if (extracted) {
      effectivePathname = extracted.startsWith('/') ? extracted : `/${extracted}`;
    }
  }

  // 1. Check Pathname Routing (/tools/:slug or /tool/:slug)
  const toolMatch = effectivePathname.match(/^\/(?:tools|tool)\/([^/?#]+)/i);
  if (toolMatch) {
    const rawSlug = decodeURIComponent(toolMatch[1]).toLowerCase();
    const seoInfo = getToolSeoInfo(rawSlug);
    if (seoInfo) {
      return { view: 'tool', toolId: seoInfo.toolId };
    }
    const foundTool = PDF_TOOLS.find((t) => t.id === rawSlug);
    if (foundTool) {
      return { view: 'tool', toolId: foundTool.id };
    }
  }

  // 1b. Check direct root slug (e.g. /pdf-to-word, /merge-pdf, /split-pdf)
  const directSlugMatch = effectivePathname.match(/^\/([^/?#]+)$/i);
  if (directSlugMatch) {
    const directSlug = decodeURIComponent(directSlugMatch[1]).toLowerCase();
    const reserved = ['blog', 'article', 'faq', 'batch', 'queue', 'sitemap', 'admin', 'index.html'];
    if (!reserved.includes(directSlug)) {
      const seoInfo = getToolSeoInfo(directSlug);
      if (seoInfo) {
        return { view: 'tool', toolId: seoInfo.toolId };
      }
      const foundTool = PDF_TOOLS.find((t) => t.id === directSlug);
      if (foundTool) {
        return { view: 'tool', toolId: foundTool.id };
      }
    }
  }

  // 2. Check Blog Pathname (/blog/:slug or /article/:slug)
  const blogMatch = effectivePathname.match(/^\/(?:blog|article)\/([^/?#]+)/i);
  if (blogMatch) {
    return { view: 'blog', articleSlug: decodeURIComponent(blogMatch[1]) };
  }
  if (effectivePathname === '/blog') {
    return { view: 'blog' };
  }

  // 3. Check Standalone Views in Pathname
  if (effectivePathname === '/faq') {
    return { view: 'faq' };
  }
  if (effectivePathname === '/batch' || effectivePathname === '/queue') {
    return { view: 'batch' };
  }

  // 4. Check Hash Routing (e.g. #/tools/merge-pdf, #merge-pdf, #split, #faq, #batch)
  if (hash) {
    const cleanHash = hash.replace(/^(?:tools|tool)\//i, '').toLowerCase();
    if (cleanHash === 'faq') {
      return { view: 'faq' };
    }
    if (cleanHash === 'batch' || cleanHash === 'queue') {
      return { view: 'batch' };
    }
    if (cleanHash === 'blog') {
      return { view: 'blog' };
    }
    if (cleanHash.startsWith('blog/')) {
      return { view: 'blog', articleSlug: cleanHash.replace('blog/', '') };
    }

    const hashSeo = getToolSeoInfo(cleanHash);
    if (hashSeo) {
      return { view: 'tool', toolId: hashSeo.toolId };
    }
    const foundByHash = PDF_TOOLS.find((t) => t.id === cleanHash);
    if (foundByHash) {
      return { view: 'tool', toolId: foundByHash.id };
    }
  }

  // 5. Check Query Parameter Routing (?tool=merge, ?article=slug, ?view=blog)
  const toolParam = params.get('tool');
  if (toolParam) {
    const normalizedParam = toolParam.toLowerCase();
    const seoInfo = getToolSeoInfo(normalizedParam);
    if (seoInfo) {
      return { view: 'tool', toolId: seoInfo.toolId };
    }
    const foundByParam = PDF_TOOLS.find(
      (t) =>
        t.id === normalizedParam ||
        ((normalizedParam === 'analysis' || normalizedParam === 'page-counter' || normalizedParam === 'page-count' || normalizedParam === 'ocr' || normalizedParam === 'pdf-ocr' || normalizedParam === 'ocr-pdf') && t.id === 'metadata') ||
        ((normalizedParam === 'image-to-pdf' || normalizedParam === 'img-to-pdf' || normalizedParam === 'images-to-pdf' || normalizedParam === 'image2pdf') && t.id === 'jpg-to-pdf')
    );
    if (foundByParam) {
      return { view: 'tool', toolId: foundByParam.id };
    }
  }

  const articleParam = params.get('article');
  if (articleParam) {
    return { view: 'blog', articleSlug: articleParam };
  }

  const viewParam = params.get('view');
  if (viewParam === 'blog') return { view: 'blog' };
  if (viewParam === 'batch' || viewParam === 'queue') return { view: 'batch' };
  if (viewParam === 'faq') return { view: 'faq' };

  const sitemapParam = params.get('sitemap');
  return {
    view: 'home',
    isSitemapModalOpen: viewParam === 'sitemap' || sitemapParam === 'true',
  };
}

/**
 * Push or replace clean dedicated tool landing page URL using HTML5 History API.
 */
export function navigateToToolUrl(toolId: string, replace = false): void {
  if (typeof window === 'undefined') return;
  const seo = getToolSeoInfo(toolId);
  const targetPath = buildAppPath(seo ? `/tools/${seo.slug}` : `/?tool=${encodeURIComponent(toolId)}`);

  if (replace) {
    window.history.replaceState({ toolId }, '', targetPath);
  } else {
    window.history.pushState({ toolId }, '', targetPath);
  }
}

/**
 * Push or replace clean dedicated blog post landing page URL (/blog/:slug) using HTML5 History API.
 */
export function navigateToBlogUrl(slug: string, replace = false): void {
  if (typeof window === 'undefined') return;
  const targetPath = buildAppPath(`/blog/${encodeURIComponent(slug)}`);
  if (replace) {
    window.history.replaceState({ blogSlug: slug }, '', targetPath);
  } else {
    window.history.pushState({ blogSlug: slug }, '', targetPath);
  }
}

/**
 * Push or replace clean blog hub URL (/blog) using HTML5 History API.
 */
export function navigateToBlogListUrl(replace = false): void {
  if (typeof window === 'undefined') return;
  if (replace) {
    window.history.replaceState({ view: 'blog' }, '', buildAppPath('/blog'));
  } else {
    window.history.pushState({ view: 'blog' }, '', buildAppPath('/blog'));
  }
}

/**
 * Return to home view via HTML5 History API.
 */
export function navigateToHomeUrl(replace = false): void {
  if (typeof window === 'undefined') return;
  if (replace) {
    window.history.replaceState({}, '', buildAppPath('/'));
  } else {
    window.history.pushState({}, '', buildAppPath('/'));
  }
}

