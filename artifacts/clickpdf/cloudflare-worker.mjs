const APEX_HOST = 'clickpdf.net';
const CANONICAL_HOST = 'www.clickpdf.net';
const UNICODE_ROUTE_MAP_PATH = '/__unicode_routes.json';
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

    if (url.hostname.toLowerCase() === APEX_HOST) {
      url.protocol = 'https:';
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }

    let decodedPath;
    try {
      decodedPath = decodeURIComponent(url.pathname);
    } catch {
      decodedPath = null;
    }

    const aliasDestination = TOOL_ROUTE_REDIRECTS.get(normalizedToolPath(url.pathname));
    if (aliasDestination) {
      url.pathname = aliasDestination;
      return Response.redirect(url.toString(), 301);
    }

    if (decodedPath && /[^\u0000-\u007f]/.test(decodedPath)) {
      const routeKey = `/${decodedPath.replace(/^\/+|\/+$/g, '')}/`;
      const routeMap = await getUnicodeRouteMap(url, env);
      const routeAssetPath = routeMap?.[routeKey];
      if (routeAssetPath) {
        const routeAssetUrl = new URL(routeAssetPath, url.origin);
        return env.ASSETS.fetch(new Request(routeAssetUrl, request));
      }
    }

    const isToolRoute = url.pathname.startsWith('/tools/') && url.pathname !== '/tools/';
    if (!isToolRoute) return env.ASSETS.fetch(request);

    const normalizedPath = normalizedToolPath(url.pathname);
    if (!url.pathname.endsWith('/')) {
      url.pathname = `${normalizedPath}/`;
      return Response.redirect(url.toString(), 301);
    }

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
