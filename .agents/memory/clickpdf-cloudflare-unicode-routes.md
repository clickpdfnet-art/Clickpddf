---
name: ClickPDF Unicode routes on Cloudflare
description: How to keep percent-encoded non-Latin static page routes from falling back to the homepage on the ClickPDF Worker.
---

For ClickPDF static assets deployed through the Cloudflare Worker, percent-encoded Unicode blog URLs can fall through to the SPA homepage even when Vite generated the corresponding HTML files. Preserve localized canonical URLs, but generate ASCII-addressable copies of those pages and a route map from decoded paths; have the Worker serve the mapped copy for Unicode requests.

**Why:** Cloudflare's static asset lookup returned the root HTML for several valid non-Latin slug paths, creating incorrect homepage canonicals on localized blog routes.

**How to apply:** Whenever sitemap routes include non-Latin slugs, keep the alias map generated from the route source rather than hand-maintaining slugs. Test every sitemap URL after deployment for its own canonical and title, not just HTTP 200.
