---
name: ClickPDF SEO-safe changes
description: Project guidance for using the BeyondSEO skill when changing ClickPDF content or SEO behavior.
---

For ClickPDF, consult the installed BeyondSEO skill when it is relevant to SEO audits or SEO-affecting site changes. Preserve unrelated site behavior and avoid changing routes, canonical URLs, hreflang, sitemap, or PDF processing unless the task requires it.

For privacy copy, distinguish where selected document bytes are processed from the page's network behavior. Browser-side processing does not prove that the page is offline, makes no network requests, safely erases memory when closed, or meets a regulatory standard.

**Why:** The audit found privacy and compliance claims that exceeded the available evidence; static code review cannot prove the page makes no network requests or guarantees safe memory erasure.

**How to apply:** Read the skill before SEO audits, content optimization, or changes likely to affect crawlability, metadata, structured data, or indexing. Qualify browser-processing claims, mention page resources and enabled third parties, and do not promise compliance or guaranteed cleanup without evidence.
