const APEX_HOST = 'clickpdf.net';
const CANONICAL_HOST = 'www.clickpdf.net';
const UNICODE_ROUTE_MAP_PATH = '/__unicode_routes.json';
const BLOG_ROUTE_MAP_PATH = '/__blog_routes.json';
const RELEASE_MANIFEST_PATH = '/__release.json';
const AD_ASSET_PATHS = new Set(['/ad-320x50.html', '/ad-320x50']);
const AD_ASSET_STORAGE_PATH = '/ad-320x50';
const PUBLIC_STATIC_PAGE_PATHS = new Set([
  '/faq',
  '/tools',
  '/batch',
  '/about',
  '/contact',
  '/privacy-policy',
  '/terms-of-service',
  '/cookies',
  '/disclaimer',
]);
export const TOOL_ROUTE_REDIRECTS = new Map([
  ['/merge-pdf', '/tools/merge-pdf/'],
  ['/split-pdf', '/tools/split-pdf/'],
  ['/compress-pdf', '/tools/compress-pdf/'],
  ['/image-to-pdf', '/tools/image-to-pdf/'],
  ['/pdf-to-image', '/tools/pdf-to-image/'],
  ['/rotate-pdf', '/tools/rotate-pdf/'],
  ['/watermark-pdf', '/tools/watermark-pdf/'],
  ['/page-numbers-pdf', '/tools/page-numbers-pdf/'],
  ['/organize-pdf', '/tools/organize-pdf/'],
  ['/edit-pdf-metadata', '/tools/edit-pdf-metadata/'],
  ['/ocr-pdf-analysis', '/tools/ocr-pdf-analysis/'],
  ['/protect-pdf-password', '/tools/protect-pdf-password/'],
  ['/unlock-pdf-password', '/tools/unlock-pdf-password/'],
  ['/pdf-to-text', '/tools/pdf-to-text/'],
  ['/pdf-to-word', '/tools/pdf-to-word/'],
  ['/pdf-to-excel', '/tools/pdf-to-excel/'],
  ['/pdf-to-powerpoint', '/tools/pdf-to-powerpoint/'],
  ['/word-to-pdf', '/tools/word-to-pdf/'],
  ['/word-to-excel', '/tools/word-to-excel/'],
  ['/excel-to-pdf', '/tools/excel-to-pdf/'],
  ['/sign-pdf-online', '/tools/sign-pdf-online/'],
  // Retain older public aliases that predate the current tool slugs.
  ['/protect-pdf', '/tools/protect-pdf-password/'],
  ['/pdf-metadata', '/tools/edit-pdf-metadata/'],
  ['/tools/protect-pdf', '/tools/protect-pdf-password/'],
  ['/tools/pdf-metadata', '/tools/edit-pdf-metadata/'],
]);

let unicodeRouteMap;
let blogRouteMap;

async function getUnicodeRouteMap(requestUrl, env) {
  if (unicodeRouteMap) return unicodeRouteMap;
  const mapUrl = new URL(UNICODE_ROUTE_MAP_PATH, requestUrl);
  const response = await env.ASSETS.fetch(new Request(mapUrl));
  if (!response.ok) return null;
  try {
    unicodeRouteMap = await response.json();
    return unicodeRouteMap;
  } catch {
    return null;
  }
}

async function getBlogRouteMap(requestUrl, env) {
  if (blogRouteMap) return blogRouteMap;
  const mapUrl = new URL(BLOG_ROUTE_MAP_PATH, requestUrl);
  const response = await env.ASSETS.fetch(new Request(mapUrl));
  if (!response.ok) return null;
  try {
    blogRouteMap = await response.json();
    return blogRouteMap;
  } catch {
    return null;
  }
}

async function fetchUnicodeRouteAsset(request, env, routeAssetPath) {
  let assetUrl = new URL(routeAssetPath, request.url);
  let response = await env.ASSETS.fetch(new Request(assetUrl, request));
  if (request.method !== 'GET' && request.method !== 'HEAD') return response;

  // Cloudflare Static Assets may redirect a generated .html asset to its
  // extensionless form. Follow only that internal mapped-asset redirect so
  // the public Unicode URL can return the page directly.
  for (let redirects = 0; redirects < 2 && response.status >= 300 && response.status < 400; redirects += 1) {
    const location = response.headers.get('location');
    if (!location) return response;

    let redirectedUrl;
    try {
      redirectedUrl = new URL(location, assetUrl);
    } catch {
      return response;
    }

    if (
      redirectedUrl.origin !== assetUrl.origin ||
      !redirectedUrl.pathname.startsWith('/__unicode_routes__/')
    ) {
      return response;
    }

    assetUrl = redirectedUrl;
    response = await env.ASSETS.fetch(new Request(assetUrl, request));
  }

  return response;
}

async function fetchAdAsset(request, env) {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = AD_ASSET_STORAGE_PATH;
  return env.ASSETS.fetch(new Request(assetUrl, request));
}

function normalizedToolPath(pathname) {
  return pathname.replace(/\/+$/, '');
}

function toolNotFound(request) {
  return new Response(request.method === 'HEAD' ? null : 'Not Found', {
    status: 404,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isApexHost = url.hostname.toLowerCase() === APEX_HOST;
    const isInsecureCanonicalHost =
      url.hostname.toLowerCase() === CANONICAL_HOST && url.protocol !== 'https:';

    let decodedPath;
    try {
      decodedPath = decodeURIComponent(url.pathname);
    } catch {
      decodedPath = null;
    }

    const isToolRoute = /^\/(?:[a-z]{2}\/)?tools\/[^/]+\/?$/i.test(url.pathname) &&
      !/^\/(?:[a-z]{2}\/)?tools\/?$/i.test(url.pathname);
    let canonicalPath = null;
    const aliasDestination = TOOL_ROUTE_REDIRECTS.get(normalizedToolPath(url.pathname));
    if (aliasDestination) {
      canonicalPath = aliasDestination;
    }

    if (!canonicalPath && !isToolRoute && decodedPath && !decodedPath.endsWith('/')) {
      const blogRouteKey = `/${decodedPath.replace(/^\/+|\/+$/g, '')}`;
      if (PUBLIC_STATIC_PAGE_PATHS.has(blogRouteKey)) {
        canonicalPath = `${blogRouteKey}/`;
      } else {
        const routeMap = await getBlogRouteMap(url, env);
        canonicalPath = routeMap?.[blogRouteKey] || null;
      }
    }

    if (!canonicalPath && isToolRoute && !url.pathname.endsWith('/')) {
      canonicalPath = `${normalizedToolPath(url.pathname)}/`;
    }

    if (isApexHost || isInsecureCanonicalHost || canonicalPath) {
      if (canonicalPath) url.pathname = canonicalPath;
      url.protocol = 'https:';
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === RELEASE_MANIFEST_PATH) {
      const response = await env.ASSETS.fetch(request);
      const headers = new Headers(response.headers);
      headers.set('cache-control', 'no-store');
      headers.set('x-robots-tag', 'noindex, nofollow');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    if (decodedPath && /[^\u0000-\u007f]/.test(decodedPath)) {
      const routeKey = `/${decodedPath.replace(/^\/+|\/+$/g, '')}/`;
      const routeMap = await getUnicodeRouteMap(url, env);
      const routeAssetPath = routeMap?.[routeKey];
      if (routeAssetPath) {
        return fetchUnicodeRouteAsset(request, env, routeAssetPath);
      }
    }

    if (AD_ASSET_PATHS.has(url.pathname)) {
      return fetchAdAsset(request, env);
    }

    if (!isToolRoute) return env.ASSETS.fetch(request);

    const normalizedPath = normalizedToolPath(url.pathname);

    const response = await env.ASSETS.fetch(request);
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
      return response;
    }

    const htmlResponse = request.method === 'HEAD'
      ? await env.ASSETS.fetch(new Request(url, {
          method: 'GET',
          headers: request.headers,
        }))
      : response;
    const html = await htmlResponse.clone().text();
    const canonical = html.match(
      /<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i,
    )?.[1];

    if (!canonical) return toolNotFound(request);
    try {
      const canonicalPath = normalizedToolPath(new URL(canonical, url.origin).pathname);
      if (canonicalPath !== normalizedPath) return toolNotFound(request);
    } catch {
      return toolNotFound(request);
    }

    return response;
  },
};
