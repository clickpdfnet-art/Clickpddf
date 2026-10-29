---
name: ClickPDF canonical blog links
description: Prevent Markdown rendering from creating non-canonical internal links.
---

In ClickPDF's static blog rendering, Markdown-it's `linkify: true` can turn bare `clickpdf.net` text into an `http://clickpdf.net` anchor even when Markdown contains no explicit URL. Canonicalize rendered link tokens after linkification, and keep the runtime blog parser aligned for explicit Markdown links and tool CTA metadata.

**Why:** A source scan can report zero non-canonical homepage URLs while generated static HTML still contains them; the production page, not only the source text, determines whether an extra redirect occurs.

**How to apply:** Test generated HTML across canonical article pages and Unicode aliases. Require homepage links to use `https://www.clickpdf.net/`, and tool links to use root-relative paths with trailing slashes.
