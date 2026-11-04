---
name: ClickPDF display ads
description: Active AdSense placement, slot-configuration, and consent rules for ClickPDF.
---

Use exactly one AdSense display placement on each actual public PDF tool page, directly below the tool-specific header. Keep the homepage, tool catalog, batch view, blog, legal pages, and other non-tool views free of ad units. Keep the placement in normal document flow, centered, responsive within a 320×50 slot, and clear of upload, processing, download, and navigation controls. Do not use Auto Ads.

Use the owner-confirmed AdSense publisher and slot IDs. The official Google tag and AdSense loader appear once in each public page head; the ad unit itself is rendered only on tool views. An explicit advertising-cookie rejection blocks ad-unit rendering and requests; accepted, dismissed, or absent consent continues to allow ads, matching the existing preference behavior.

Keep the root `ads.txt` to the one approved standard Google record. Do not create additional records or duplicate source copies.

**Why:** the user approved one 320×50 tool-header placement, required the Google tags in every public page head, and retained the explicit advertising-consent opt-out.

**How to apply:** preserve the single header placement and saved consent key. Verify the build, static `ads.txt` response, all generated page-head tags, and consent tests. Do not claim a creative is visible without live evidence; never deploy or modify provider settings unless separately requested.
