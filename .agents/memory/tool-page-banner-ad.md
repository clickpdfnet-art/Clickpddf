---
name: Global ClickPDF tool-page banner ad
description: Project-wide placement, privacy, and fill-detection rules for the third-party banner.
---

Every individual tool page must inherit one shared 320×50 ad slot immediately after the global header and before its Back button. New tool routes should receive it through the common selected-tool layout, not per-tool code. Homepage, catalog, and non-tool pages must not show it.

**Why:** the user made automatic coverage of current and future tool pages a standing project requirement.

**How to apply:** preserve the shared route-level slot and keep ad markup out of tool components. Load the supplied provider script only after explicit cookie acceptance, in a sandbox without `allow-same-origin`; keep hidden with zero space unless visible creative content is confirmed. On 2026-10-21 the provider URL returned HTTP 200 with an empty JavaScript body in this environment, and no documented fill callback was available. Do not treat script load or a cross-origin iframe's `load` event alone as proof of an ad impression; recheck provider behavior before relaxing the fail-closed detection.
