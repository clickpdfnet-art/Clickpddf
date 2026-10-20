---
name: PDF to Word fidelity and verification
description: User-required editability/fallback policy and the DOCX textbox schema trap.
---

Both Word conversion modes must keep text editable by default. Full-page images are an explicit, disclosed fallback, never a silent substitute for a failed conversion. Identify noneditable fallback pages and report font substitutions, flattened artwork and OCR uncertainty.

**Why:** The user explicitly requested the best practical balance between editability and visual fidelity, prohibited default page rasterization, and required honest limitations rather than pixel-perfect claims.

**How to apply:** Preserve language selection, client-side processing and existing downloads. Treat an HTML DOCX content preview as a content check only, not evidence of Word pagination or positioning. Do not claim measured visual equivalence without rendering and comparing the actual DOCX in a Word-compatible layout engine.

The installed DOCX library's Textbox API accepts text runs in its TypeScript signature, but valid OOXML textbox content needs paragraph blocks. Its documentation and public typing disagree. Textbox inset and default borders can also shift or decorate otherwise correctly positioned PDF text.

**Why:** A passing TypeScript build generated runs directly under the textbox content element, which is not valid Word block structure.

**How to apply:** Verify the actual generated OOXML, including paragraph nesting and inner RTL properties, rather than relying on compilation or an HTML reader. Preserve explicit zero insets and transparent, borderless boxes for positioned PDF text.
