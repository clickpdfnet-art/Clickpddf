const APEX_HOST = 'clickpdf.net';
const CANONICAL_HOST = 'www.clickpdf.net';
const UNICODE_ROUTE_MAP_PATH = '/__unicode_routes.json';

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

    return env.ASSETS.fetch(request);
  },
};
