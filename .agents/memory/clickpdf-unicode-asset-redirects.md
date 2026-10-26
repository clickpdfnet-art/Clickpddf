---
name: Cloudflare Unicode asset redirects
description: Keep public localized blog URLs free of internal Cloudflare asset redirects.
---

Cloudflare Static Assets can return a 307 when a Worker fetches a generated Unicode-route `.html` alias, pointing to the same internal asset without the `.html` suffix. For sitemap URLs that already are the intended canonical pages, follow this same-origin redirect inside the Worker only when its path remains under the generated `__unicode_routes__/` namespace. Do not redirect the visitor or change the localized canonical URL.

**Why:** Live ClickPDF requests showed correct localized HTML and canonical metadata after the internal 307, but exposing the hashed asset hop adds an unnecessary redirect between sitemap URL and page response.

**How to apply:** Preserve the generated route map and canonical metadata; test representative Unicode locales through a simulated Static Assets 307 and verify the public request returns the page directly with its original canonical and hreflang tags.
