---
name: ClickPDF localization rollout
description: The user's chosen scope and method for translating ClickPDF.
---

ClickPDF should support all 21 existing languages. Add translations manually in stages; do not add an AI translation integration as part of this work.

**Why:** the user selected complete support for the current 21 languages and chose a stepwise approach without AI integration.

**How to apply:** prioritize visible shared navigation, tool catalog, and tool workflow strings, then continue through tool-specific help, FAQs, and other site sections. Report remaining untranslated sections honestly between stages.

For legal content, all six public pages should be available in all 21 languages, and the legal modal should show the same localized canonical page text rather than maintaining separate policy prose.

**Why:** the user explicitly chose all six pages and confirmed the modal should reuse the canonical page text.

**How to apply:** keep route and modal wording aligned, including the Disclaimer, and retain the existing localized footer labels.

When editing localized SEO JSON, use locale-scoped patch context; generic repeated tool anchors can place copy under the wrong locale. Extend existing locale objects and check for duplicate keys, which normal JSON parsing may silently accept.

**Why:** a staged batch edit once introduced repeated locale keys, and a later context-free insertion matched an earlier tool key in the file. Ordinary JSON parsing can hide duplicate keys, and misplaced copy can silently replace valid translations.

**How to apply:** anchor changes to the target locale and tool, then parse with duplicate-key detection and verify exact tool-language pairs and generated routes before building.

Source-level translations alone do not prove a localized SEO page is complete: translated tool content and its localized title/description must both appear in the generated HTML and sitemap.

**Why:** a localization batch passed structural source checks but exposed a missing generated meta description and an HTML-escaping mismatch only in the built-route regression test.

**How to apply:** when adding localized tool pages, verify generated title, description, canonical URL, and sitemap entry in addition to the JSON content and QA ledger.
