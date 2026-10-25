---
name: Global ClickPDF tool-page banner ad
description: Project-wide placement, privacy, and fill-detection rules for the third-party banner.
---

Show a single centered 320×50 banner directly below the global header and before the Back control on individual tool pages and the batch queue. Keep the homepage, catalog, blog, legal pages, and other non-tool views ad-free, and do not duplicate the banner during tool navigation.

The single Adsterra banner loads by default unless the visitor explicitly rejects advertising cookies. Dismissing the notice is not an opt-out. Keep the cookie notice visible and make rejection explicit. Keep the provider in an isolated sandbox without `allow-same-origin`; never send document contents to the ad provider.

Adsterra's supplied script does not expose a verifiable fill callback. A nested iframe load can be used only as a compatible visibility proxy; it does not prove that an actual creative filled. Collapse the slot when no frame signal arrives before timeout, and never claim verified impressions or pixel content.

**Why:** the user requested default-on loading for the single active banner, an explicit advertising opt-out, and no cross-origin inspection of the creative.

**How to apply:** preserve the shared ad placement and consent notice behavior. Keep file processing isolated from ad scripts. Use an official provider fill signal if one becomes available; otherwise describe the fallback as frame-load detection only.
