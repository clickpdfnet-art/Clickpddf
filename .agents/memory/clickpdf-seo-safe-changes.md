---
name: ClickPDF SEO-safe changes
description: Project guidance for using the BeyondSEO skill when changing ClickPDF content or SEO behavior.
---

For ClickPDF, do not use the BeyondSEO skill unless the user explicitly asks to use it again. Preserve unrelated site behavior and avoid changing routes, canonical URLs, hreflang, sitemap, or PDF processing unless the task requires it.

The BeyondSEO crawler may not be runnable in Replit's system Python when its parser dependency is missing. Do not add project-level Python dependencies or restart app workflows just to enable a one-off content review; use the skill's writing guidance and report that the crawl was unavailable unless an approved isolated runtime is available.

**Why:** The bundled setup expects a virtual environment, while Replit package installation can alter project dependency files and restart workflows unrelated to an article review.

**How to apply:** Check the native doctor first. If its runtime is blocked and no approved isolated runtime exists, do not imply a crawler audit ran; continue only with independently verifiable content and link evidence.

In this Replit environment, adding Playwright to the isolated BeyondSEO runtime still did not enable browser crawls: Chromium exited because `libnspr4.so` was missing. HTTP mode remained usable, but JavaScript-shell captures must be reported as partial.

**Why:** The browser doctor recorded a Chromium launch failure after the Python browser package installed successfully; the missing native library is outside the project package set.

**How to apply:** Before any browser-mode BeyondSEO crawl, confirm the doctor can launch Chromium. If it cannot, use HTTP mode only where appropriate and clearly label incomplete captures; do not claim client-rendered content was inspected.

For privacy copy, distinguish where selected document bytes are processed from the page's network behavior. Browser-side processing does not prove that the page is offline, makes no network requests, safely erases memory when closed, or meets a regulatory standard.

**Why:** The user asked to stop using the project-provided skill while keeping its files. The audit also found privacy and compliance claims that exceeded the available evidence; static code review cannot prove the page makes no network requests or guarantees safe memory erasure.

**How to apply:** Use other available evidence and instructions for future SEO requests unless the user re-enables BeyondSEO. Qualify browser-processing claims, mention page resources and enabled third parties, and do not promise compliance or guaranteed cleanup without evidence.
