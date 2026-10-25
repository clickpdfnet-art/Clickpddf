---
name: ClickPDF structured data
description: Keep Schema.org markup accurate to the page content and canonical routes users can actually open.
---

Page-specific structured data must describe content visible on a real canonical route. The homepage should not claim to be an FAQ page when the FAQ content lives at `/faq/`; company and policy pages now have dedicated canonical routes, so generate their metadata and schemas from the shared legal-page data.

**Why:** Search engines and structured-data validators compare markup with the rendered page; marking hidden or nonexistent content can be misleading and produce invalid search signals.

**How to apply:** Generate raw-head JSON-LD from the active public route registry and page data. Keep footer modals as convenience UI, but only publish page schemas for the matching visible standalone routes.

For generated tool pages, keep static HTML metadata and workflow schema aligned with the normalized public tool registry. A static page can otherwise build successfully while silently using generic titles/descriptions or empty HowTo step fields.

**Why:** Runtime and build-time code may expose the same tool metadata in different shapes; schema-presence checks alone do not catch a fallback description or missing step text.

**How to apply:** Test generated raw HTML against the active registry: canonical tool title and description should match, and every HowTo step must have a readable name and text.
