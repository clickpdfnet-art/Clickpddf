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

When adding localized SEO content, extend the existing locale object rather than appending another object with the same JSON key. JavaScript silently keeps the later duplicate key, which can hide or discard a locale’s earlier tool entries.

**Why:** a staged batch edit once introduced repeated locale keys; ordinary JSON parsing did not report the duplicate, while the last object replaced prior translations.

**How to apply:** after editing the locale bundle, verify that each locale key occurs once and that the expected tool-language pairs and generated routes still match.
