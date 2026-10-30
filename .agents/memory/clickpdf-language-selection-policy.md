---
name: ClickPDF language selection policy
description: ClickPDF must default new visitors to English without browser or location-based selection.
---

For ClickPDF, English is the initial language for every visitor unless they explicitly chose another language before. Do not auto-select from browser language, country, IP, Geo-IP, or location, and do not automatically redirect to localized URLs. Preserve the manual 21-language selector, saved manual preference, translations, and explicit localized routes.

**Why:** The user specified this as the required site behavior on 2026-10-30; the existing browser-locale fallback conflicts with it.

**How to apply:** When changing language initialization, retain the saved manual preference and explicit locale routes, but never consult `navigator.language`, `navigator.languages`, or location to choose a visitor's initial language.
