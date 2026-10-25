const APEX_HOST = 'clickpdf.net';
const CANONICAL_HOST = 'www.clickpdf.net';
const UNICODE_ROUTE_MAP_PATH = '/__unicode_routes.json';
const LEGACY_TOOL_REDIRECTS = new Map([
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
    const legacyDestination = LEGACY_TOOL_REDIRECTS.get(normalizedPath);
    if (legacyDestination) {
      url.pathname = legacyDestination;
      return Response.redirect(url.toString(), 301);
    }

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
