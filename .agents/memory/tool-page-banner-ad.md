---
name: Global ClickPDF tool-page banner ad
description: Project-wide placement, privacy, and fill-detection rules for the third-party banner.
---

Every individual tool page and the batch queue must use the reusable 320×50 AdsterraBanner immediately after the global header and before the Back button. Standard tools inherit it from ToolWorkspace; independent workspaces such as Sign PDF must include it in their own layout. Homepage, catalog, and non-tool pages must not show it.

The single Adsterra banner is enabled by default unless the visitor explicitly rejects advertising cookies. A normal dismissal is not an opt-out. Keep the cookie notice and make rejection explicit. Reveal the slot after the provider-created banner iframe loads, without inspecting cross-origin creative contents; collapse it if no valid 320×50 provider iframe loads before timeout.

**Why:** the user requested default-on loading for the approved, active single banner, an explicit opt-out, and removal of cross-origin content inspection.

**How to apply:** preserve one reusable AdsterraBanner and do not mount a second route-level instance. Keep the provider script sandboxed without `allow-same-origin`, and pass only the site origin as referrer so the provider can validate the approved domain. An iframe `load` event confirms only that the frame navigated, not that an actual ad filled; do not claim verified impressions or pixel content without a provider fill signal.
