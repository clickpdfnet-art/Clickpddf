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

Tesseract.js 7 can load preloaded model-byte objects but misinterpret their byte payloads as language codes during OCR initialization. Prefer the library's language-code API and verify with a real scanned PDF in the target browser; unit tests alone did not expose the hang.

**Why:** Browser batch conversion looked successful for selectable-text PDFs but left the scanned page waiting at API initialization when model bytes were passed as object payloads.

**How to apply:** Test at least one raster-only page end to end through the bundled browser worker, OCR model fetch, recognition, DOCX, and ZIP. Verify recognized text and page-level OCR status rather than only worker progress or a generated ZIP.

Browser test evidence is engine- and version-specific. A completed Firefox run does not establish native Safari behavior; WebKitGTK is a related but separate product.

**Why:** The Linux test host completed PDF-to-Word in Firefox 140, but WebKitGTK's MiniBrowser could not launch because the headless test environment lacked a usable EGL display.

**How to apply:** Report the exact tested engine/version, keep Safari marked unverified until a native Safari run succeeds, and distinguish engine-reported OCR confidence from measured text accuracy.
