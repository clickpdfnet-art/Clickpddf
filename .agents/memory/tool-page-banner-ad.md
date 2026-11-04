---
name: ClickPDF display ads
description: Active AdSense placement, slot-configuration, and consent rules for ClickPDF.
---

Use exactly two AdSense display placements on actual PDF tool pages: one directly below the tool-specific header and one immediately before the existing Back/navigation bar. Keep the homepage, tool catalog, batch view, blog, legal pages, and other non-tool views ad-free. Keep both placements in normal document flow, centered, responsive within a 320×50 slot, and clear of upload, processing, download, and navigation controls. Do not use Auto Ads.

The owner must provide two real AdSense slot IDs before either placement is rendered or the official provider script is requested. Named placeholders fail closed: no request, iframe, or visible blank slot. Load the official AdSense script only once after both IDs are valid. An explicit advertising-cookie rejection blocks requests; accepted, dismissed, or absent consent continues to allow ads, matching the existing preference behavior.

Keep the root `ads.txt` to the one approved standard Google record. Do not create additional records or duplicate source copies.

**Why:** the user replaced the previous ad provider and specified two tool-only placements, an explicit consent opt-out, and no active ad requests until the two real slot IDs are available.

**How to apply:** preserve the two named tool placements and the saved consent key. Verify the build, static `ads.txt` response, and fail-closed tests locally. Do not claim a creative is visible without checking with valid owner-supplied slots; never deploy or modify provider settings unless separately requested.
