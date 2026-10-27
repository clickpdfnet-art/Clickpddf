---
name: ClickPDF Cloudflare 404 behavior
description: Use real not-found responses for ClickPDF's pre-rendered static routes.
---

For ClickPDF production, use Cloudflare's `404-page` handling with a real `404.html`. Do not use single-page-application fallback: public routes are pre-rendered, and SPA fallback can return the homepage with HTTP 200 for arbitrary URLs. The 404 page must not contain the old GitHub Pages redirect script.

**Why:** A live unknown URL returned the homepage with status 200, masking missing routes from users and crawlers.

**How to apply:** Keep only one not-found mode in the Cloudflare assets configuration; ensure the custom page is accessible and marked `noindex`; verify known routes return 200 and unknown routes return 404 before and after deployment.
