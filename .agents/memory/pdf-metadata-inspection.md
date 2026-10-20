---
name: Read-only PDF metadata inspection
description: Avoid misleading Producer and date values when inspecting or testing saved PDF metadata.
---

Read-only PDF metadata inspection and output validation must disable pdf-lib's automatic metadata updates when loading a document.

**Why:** pdf-lib changes Producer and modification date during its default load. A correctly saved custom Producer can therefore appear incorrect, and a correctly cleared Producer can appear populated, solely because of the inspection itself.

**How to apply:** Use `PDFDocument.load(bytes, { updateMetadata: false })` when checking original or saved metadata. Validate the actual saved bytes without allowing the reader to mutate their in-memory metadata first.
