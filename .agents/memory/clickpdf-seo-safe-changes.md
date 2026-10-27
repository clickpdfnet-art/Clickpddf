---
name: ClickPDF SEO-safe changes
description: Project guidance for using the BeyondSEO skill when changing ClickPDF content or SEO behavior.
---

For ClickPDF, do not use the BeyondSEO skill unless the user explicitly asks to use it again. Preserve unrelated site behavior and avoid changing routes, canonical URLs, hreflang, sitemap, or PDF processing unless the task requires it.

For privacy copy, distinguish where selected document bytes are processed from the page's network behavior. Browser-side processing does not prove that the page is offline, makes no network requests, safely erases memory when closed, or meets a regulatory standard.

**Why:** The user asked to stop using the project-provided skill while keeping its files. The audit also found privacy and compliance claims that exceeded the available evidence; static code review cannot prove the page makes no network requests or guarantees safe memory erasure.

**How to apply:** Use other available evidence and instructions for future SEO requests unless the user re-enables BeyondSEO. Qualify browser-processing claims, mention page resources and enabled third parties, and do not promise compliance or guaranteed cleanup without evidence.
