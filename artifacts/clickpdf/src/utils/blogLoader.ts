import { BlogPost } from '../types';
import generatedBlogWatermarks from '../data/blogWatermarkMap.json';

const blogWatermarks: Record<string, string> = generatedBlogWatermarks;
const defaultCoverImage = 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80';

function normalizeInternalBlogToolLink(target: string): string {
  try {
    const url = new URL(target, 'https://www.clickpdf.net');
    if (!['clickpdf.net', 'www.clickpdf.net'].includes(url.hostname)) return target;

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
    return target;
  }
  return target;
}

function normalizeBlogBodyLinks(body: string): string {
  return body.replace(/\]\(([^)\s]+)([^)]*)\)/g, (_match, target: string, suffix: string) =>
    `](${normalizeInternalBlogToolLink(target)}${suffix})`,
  );
}

function normalizeArticleRoutePath(value?: string): string | undefined {
  const candidate = value?.trim();
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//') || /[?#]/.test(candidate)) {
    return undefined;
  }

  const segments = candidate.split('/').filter(Boolean);
  if (!segments.length || segments.some((segment) => segment === '.' || segment === '..')) {
    return undefined;
  }

  return `/${segments.join('/')}/`;
}

function parseFaqItems(value?: string): Array<{ question: string; answer: string }> | undefined {
  if (!value) return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return undefined;
    const items = parsed.filter(
      (item): item is { question: string; answer: string } =>
        !!item &&
        typeof item === 'object' &&
        typeof (item as { question?: unknown }).question === 'string' &&
        typeof (item as { answer?: unknown }).answer === 'string',
    );
    return items.length ? items : undefined;
  } catch {
    return undefined;
  }
}

function parseBreadcrumbs(value?: string): Array<{ name: string; url: string }> | undefined {
  if (!value) return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return undefined;
    const items = parsed.flatMap((item) => {
      if (
        !item ||
        typeof item !== 'object' ||
        typeof (item as { name?: unknown }).name !== 'string' ||
        typeof (item as { url?: unknown }).url !== 'string'
      ) return [];
      const name = (item as { name: string }).name.trim();
      const url = (item as { url: string }).url.trim();
      if (!name || !/^https?:\/\//i.test(url)) return [];
      return [{ name, url }];
    });
    return items.length ? items : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Parses frontmatter and markdown body from raw file contents.
 * Supports standard YAML style:
 * ---
 * title: Example Title
 * slug: example-slug
 * ...
 * ---
 * Markdown content here
 */
export function parseMarkdownPost(rawFileContent: string, fileName?: string): BlogPost {
  const trimmed = (rawFileContent || '').trim();
  const frontmatter: Record<string, string> = {};
  let bodyContent = trimmed;

  if (trimmed.startsWith('---')) {
    // Match frontmatter block enclosed in ---
    const match = trimmed.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (match) {
      const rawYaml = match[1];
      bodyContent = normalizeBlogBodyLinks(match[2].trim());

      rawYaml.split(/\r?\n/).forEach((line) => {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          const rawKey = line.substring(0, colonIdx).trim().toLowerCase().replace(/[\s_-]+/g, '');
          let val = line.substring(colonIdx + 1).trim();
          // Strip surrounding single or double quotes
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.substring(1, val.length - 1).trim();
          }
          frontmatter[rawKey] = val;
        }
      });
    }
  }

  // Derive slug from frontmatter or filename
  const derivedSlug = (
    frontmatter['slug'] ||
    frontmatter['id'] ||
    (fileName ? fileName.replace(/^.*[\\/]/, '').replace(/\.(md|json)$/i, '') : '') ||
    'clickpdf-guide'
  ).toLowerCase().trim();

  // Word count & read time calculation if not provided
  const wordCount = bodyContent.split(/\s+/).filter(Boolean).length;
  const calculatedReadTime = `${Math.max(2, Math.ceil(wordCount / 180))} min read`;

  // Excerpt fallback from first paragraph if not provided
  let excerpt = frontmatter['summary'] || frontmatter['excerpt'] || frontmatter['description'] || '';
  if (!excerpt) {
    const firstPara = bodyContent.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)[0] || '';
    excerpt = firstPara.replace(/[#*`_]/g, '').slice(0, 190) + (firstPara.length > 190 ? '...' : '');
  }

  // Target Tool mapping for internal link juice and CTAs
  let targetToolUrl = frontmatter['targettoolurl'] || frontmatter['targettoollink'] || frontmatter['toollink'] || frontmatter['targettool'];
  if (targetToolUrl && !targetToolUrl.startsWith('/') && !targetToolUrl.startsWith('http')) {
    targetToolUrl = `/tools/${targetToolUrl}`;
  }
  if (targetToolUrl) {
    targetToolUrl = normalizeInternalBlogToolLink(targetToolUrl);
  }

  let targetToolTitle = frontmatter['targettooltitle'] || frontmatter['tooltitle'];
  if (!targetToolTitle && targetToolUrl) {
    const clean = targetToolUrl.replace(/^\/tools\//, '').replace(/-pdf$/, '').replace(/-/g, ' ');
    targetToolTitle = `${clean.charAt(0).toUpperCase() + clean.slice(1)} PDF Tool`;
  }

  const targetToolCta = frontmatter['targettoolcta'] || frontmatter['toolcta'] || (targetToolTitle ? `Open ${targetToolTitle} In-Browser` : undefined);
  const coverSource = frontmatter['coverimage'] || frontmatter['image'] || defaultCoverImage;

  return {
    id: frontmatter['id'] || `art-${derivedSlug}`,
    title: frontmatter['title'] || derivedSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    slug: derivedSlug,
    category: frontmatter['category'] || 'Guides & Security',
    date: frontmatter['date'] || 'April 2026',
    readTime: frontmatter['readtime'] || calculatedReadTime,
    author: frontmatter['author'] || 'ClickPDF Editorial Team',
    coverImage: blogWatermarks[coverSource] || coverSource,
    excerpt,
    content: bodyContent,
    targetTool: frontmatter['targettool'] || undefined,
    targetToolUrl: targetToolUrl || undefined,
    targetToolTitle: targetToolTitle || undefined,
    targetToolCta: targetToolCta || undefined,
    locale: frontmatter['locale'] || undefined,
    translationGroup: frontmatter['translationgroup'] || undefined,
    seoTitle: frontmatter['seotitle'] || undefined,
    seoDescription: frontmatter['seodescription'] || undefined,
    seoKeywords: frontmatter['seokeywords'] || undefined,
    imageAlt: frontmatter['imagealt'] || undefined,
    routePath: normalizeArticleRoutePath(frontmatter['routepath']),
    breadcrumbs: parseBreadcrumbs(frontmatter['breadcrumbs']),
    faqItems: parseFaqItems(frontmatter['faqitems']),
  };
}

/**
 * Auto-scans the /src/blogs/ folder via Vite's import.meta.glob.
 * Any new .md file pushed to GitHub into src/blogs/ is automatically
 * discovered, parsed, and registered at build/run time with zero code edits!
 */
export function loadAllBlogPostsFromFolder(): BlogPost[] {
  const posts: BlogPost[] = [];

  try {
    // 1. Scan Markdown (.md) files in src/blogs/
    const mdModules = import.meta.glob('/src/blogs/*.md', {
      eager: true,
      query: '?raw',
      import: 'default'
    }) as Record<string, string>;

    for (const [path, rawContent] of Object.entries(mdModules)) {
      if (typeof rawContent === 'string' && rawContent.trim()) {
        const post = parseMarkdownPost(rawContent, path);
        posts.push(post);
      }
    }

    // 2. Scan JSON (.json) files in src/blogs/ as an alternative format
    const jsonModules = import.meta.glob('/src/blogs/*.json', {
      eager: true,
      import: 'default'
    }) as Record<string, any>;

    for (const [path, jsonContent] of Object.entries(jsonModules)) {
      if (jsonContent && typeof jsonContent === 'object') {
        const rawString = typeof jsonContent.content === 'string'
          ? `---\n${Object.entries(jsonContent).filter(([k]) => k !== 'content').map(([k, v]) => `${k}: ${v}`).join('\n')}\n---\n${jsonContent.content}`
          : JSON.stringify(jsonContent);
        const post = parseMarkdownPost(rawString, path);
        // Avoid duplicate slug
        if (!posts.some((p) => p.slug === post.slug)) {
          posts.push(post);
        }
      }
    }
  } catch (err) {
    console.warn('[ClickPDF] Notice: Error scanning /src/blogs/ folder:', err);
  }

  // Sort by date or id descending so newest articles appear first
  const orderedPosts = posts.sort((a, b) => {
    try {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      if (!isNaN(timeA) && !isNaN(timeB)) return timeB - timeA;
    } catch {}
    return b.id.localeCompare(a.id);
  });

  const translatedGroups = new Map<string, BlogPost[]>();
  orderedPosts.forEach((post) => {
    if (!post.translationGroup || !post.locale) return;
    const group = translatedGroups.get(post.translationGroup) || [];
    group.push(post);
    translatedGroups.set(post.translationGroup, group);
  });

  translatedGroups.forEach((group) => {
    const alternateUrls = group
      .filter((post) => post.locale)
      .map((post) => ({
        locale: post.locale!,
        url: `https://www.clickpdf.net${post.routePath || `/blog/${encodeURIComponent(post.slug)}/`}`,
      }));
    group.forEach((post) => {
      post.alternateUrls = alternateUrls;
    });
  });

  return orderedPosts;
}

/**
 * Returns all active blog articles.
 * Combines folder-scanned Markdown posts from src/blogs/ with any admin-created articles.
 */
export function getActiveBlogArticles(): BlogPost[] {
  const folderPosts = loadAllBlogPostsFromFolder();

  // If user saved articles through Admin in localStorage, reconcile them
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('clickpdf_articles_v3');
      if (raw) {
        const stored = JSON.parse(raw);
        if (Array.isArray(stored) && stored.length > 0) {
          // Merge: folder posts take precedence for synced posts, but keep extra user posts
          const merged = [...folderPosts];
          for (const item of stored) {
            if (!merged.some((p) => p.slug === item.slug || p.id === item.id)) {
              merged.push(item);
            }
          }
          return merged;
        }
      }
    } catch {}
  }

  return folderPosts;
}
