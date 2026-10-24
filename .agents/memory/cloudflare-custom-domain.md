---
name: Cloudflare custom-domain routing
description: DNS and token permission requirements for ClickPDF custom-domain Worker routes and apex redirects.
---

For the ClickPDF static-assets Worker to serve `www.clickpdf.net` while redirecting the apex, `www` needs a proxied CNAME to `clickpdf.net`. The deployment token must include zone DNS edit/read, zone Workers Routes edit, and account Workers Scripts edit. DNS-only credentials can create the CNAME but cannot deploy the Worker; Worker-only credentials cannot create the DNS record.

Do not activate the apex redirect until the `www` host can reach the Worker, or visitors may be redirected to an unavailable host. After publishing DNS, the Replit container's resolver can retain a negative cache even after public DNS-over-HTTPS resolvers return the new Cloudflare addresses; verify host routing with a public DNS result and `curl --resolve` when needed.

**Why:** The first credential update allowed DNS changes but not Worker deployment, and local DNS continued to report a cached failure after public resolvers had the new record.

**How to apply:** For future custom-host Worker changes, confirm the proxied DNS record and combined permissions before deployment; validate both apex redirect and www asset response on the production edge.
