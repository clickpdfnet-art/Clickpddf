---
name: ClickPDF structured data
description: Keep Schema.org markup accurate to the page content and canonical routes users can actually open.
---

Page-specific structured data must describe content that is visible on that canonical page. The homepage should not claim to be an FAQ page when the FAQ content lives at `/faq/`. Legal, About, and Contact content that exists only inside a modal has no separate canonical page and should not receive fabricated page URLs or page schemas.

**Why:** Search engines and structured-data validators compare markup with the rendered page; marking hidden or nonexistent content can be misleading and produce invalid search signals.

**How to apply:** Generate raw-head JSON-LD from the active public route registry and page data. Add schemas for modal content only if it is later given a real, indexable route with matching visible content.
