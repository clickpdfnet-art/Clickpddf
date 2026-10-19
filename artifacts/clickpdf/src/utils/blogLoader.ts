import { BlogPost } from '../types';

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
      bodyContent = match[2].trim();

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

  let targetToolTitle = frontmatter['targettooltitle'] || frontmatter['tooltitle'];
  if (!targetToolTitle && targetToolUrl) {
    const clean = targetToolUrl.replace(/^\/tools\//, '').replace(/-pdf$/, '').replace(/-/g, ' ');
    targetToolTitle = `${clean.charAt(0).toUpperCase() + clean.slice(1)} PDF Tool`;
  }

  const targetToolCta = frontmatter['targettoolcta'] || frontmatter['toolcta'] || (targetToolTitle ? `Open ${targetToolTitle} In-Browser` : undefined);

  return {
    id: frontmatter['id'] || `art-${derivedSlug}`,
    title: frontmatter['title'] || derivedSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    slug: derivedSlug,
    category: frontmatter['category'] || 'Guides & Security',
    date: frontmatter['date'] || 'April 2026',
    readTime: frontmatter['readtime'] || calculatedReadTime,
    author: frontmatter['author'] || 'ClickPDF Editorial Team',
    coverImage: frontmatter['coverimage'] || frontmatter['image'] || 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
    excerpt,
    content: bodyContent,
    targetTool: frontmatter['targettool'] || undefined,
    targetToolUrl: targetToolUrl || undefined,
    targetToolTitle: targetToolTitle || undefined,
    targetToolCta: targetToolCta || undefined
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
  return posts.sort((a, b) => {
    try {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      if (!isNaN(timeA) && !isNaN(timeB)) return timeB - timeA;
    } catch {}
    return b.id.localeCompare(a.id);
  });
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
