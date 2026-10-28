---
name: Global ClickPDF tool-page banner ad
description: Project-wide placement, privacy, and fill-detection rules for the third-party banner.
---

Show a single centered 320×50 banner directly below the global header and before the Back control on individual tool pages and the batch queue. Keep the homepage, catalog, blog, legal pages, and other non-tool views ad-free, and do not duplicate the banner during tool navigation.

The single Adsterra banner loads by default unless the visitor explicitly rejects advertising cookies. Dismissing the notice is not an opt-out. Keep the cookie notice visible and make rejection explicit. Use the separate static ad document in a sandbox without `allow-same-origin`; do not switch to same-origin `srcDoc` with scripts enabled, which would give third-party ad code access to the parent page.

Adsterra's supplied script does not expose a verifiable fill callback. Keep the 320×50 slot visible when the provider does not fill it; a blank slot is preferable to hiding the placement after a timeout. Never claim verified impressions or pixel content based only on a script or iframe load.

**Why:** the user requested default-on loading, an explicit advertising opt-out, an isolated third-party script, and a persistent placement even when the provider does not fill it. The user also chose to keep the existing static iframe instead of enabling same-origin script access.

**How to apply:** preserve the shared ad placement and consent notice behavior. Load the static ad page by URL and keep the iframe sandboxed without `allow-same-origin`; do not add same-origin access for provider scripts. Keep the fixed-size slot visible on no-fill, and use provider evidence before claiming an ad actually rendered.

When a banner is blank, record both the provider script's HTTP status and response byte count before changing iframe or layout code. A successful HTTP status with an empty body means the provider supplied no creative; it is not evidence of a local spacing failure.
