---
name: ClickPDF Cloudflare 404 behavior
description: Use real not-found responses for ClickPDF's pre-rendered static routes.
---

For ClickPDF production, use Cloudflare's `404-page` handling with a real `404.html`. Do not use single-page-application fallback: public routes are pre-rendered, and SPA fallback can return the homepage with HTTP 200 for arbitrary URLs. The 404 page must not contain the old GitHub Pages redirect script.

The ad document is a special static route: Cloudflare may redirect its `.html` path to an extensionless asset URL. Serve that route explicitly through the asset binding, and make the service worker fetch it from the network without cache fallback so an old app-shell response cannot masquerade as an ad page.

**Why:** A live unknown URL previously returned the homepage with status 200, and a user later saw a React 404 at the ad URL despite the current static asset resolving correctly through Cloudflare's internal redirect.

**How to apply:** Keep only one not-found mode in the Cloudflare assets configuration; ensure the custom page is accessible and marked `noindex`; verify the ad URL returns its static HTML, known routes return 200, and unknown routes return 404 before and after deployment.
