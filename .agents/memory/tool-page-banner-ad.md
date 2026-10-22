---
name: Global ClickPDF tool-page banner ad
description: Project-wide placement, privacy, and fill-detection rules for the third-party banner.
---

Every individual tool page must inherit one shared 320×50 ad slot immediately after the global header and before its Back button. New tool routes should receive it through the common selected-tool layout, not per-tool code. Homepage, catalog, and non-tool pages must not show it.

The single Adsterra banner is enabled by default unless the visitor explicitly rejects advertising cookies. A normal dismissal is not an opt-out. Keep the cookie notice and make rejection explicit. Reveal the slot after the provider-created banner iframe loads, without inspecting cross-origin creative contents; collapse it if no valid 320×50 provider iframe loads before timeout.

**Why:** the user requested default-on loading for the approved, active single banner, an explicit opt-out, and removal of cross-origin content inspection.

**How to apply:** preserve the shared route-level slot and keep ad markup out of tool components. Keep the provider script sandboxed without `allow-same-origin`, and pass only the site origin as referrer so the provider can validate the approved domain. An iframe `load` event confirms only that the frame navigated, not that an actual ad filled; do not claim verified impressions or pixel content without a provider fill signal.
