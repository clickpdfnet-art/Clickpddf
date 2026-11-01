---
name: CropBox test semantics
description: Distinguish PDF page clipping from deletion when validating crop behavior.
---

PDF.js text extraction can omit text outside a PDF page's CropBox even when that text remains in the saved page content stream. A text-extraction check alone therefore cannot show whether cropping deleted the underlying content.

**Why:** CropBox controls the visible or printable region; it is not redaction. Tests that infer deletion from what a viewer or extractor displays can give a false result.

**How to apply:** For crop behavior, verify the resulting page boxes and inspect the underlying page content when asserting that off-box content remains. Treat secure redaction as a separate operation that must remove or sanitize content.
