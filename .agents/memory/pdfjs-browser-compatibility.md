---
name: PDF.js browser compatibility
description: Why ClickPDF uses the polyfilled PDF.js build and matching worker.
---

Keep PDF.js API imports and workers on matching browser-compatible builds. Prefer the legacy/polyfilled distribution for ClickPDF's browser support.

**Why:** PDF.js 6's standard distribution assumed Map.getOrInsertComputed support that the real browser lacked. TypeScript and production builds passed, but thumbnails and image exports failed at runtime.

**How to apply:** Preserve this compatibility choice when adding PDF consumers or upgrading PDF.js. Verify an actual rendered page/export, not just a successful build.
