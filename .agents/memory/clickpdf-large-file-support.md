---
name: ClickPDF large-file and batch expectations
description: Product requirements for multi-file processing and large client-side documents.
---

ClickPDF should let users add multiple files without leaving or resetting the selected tool, and should support 100–300 MB files where the user's device has enough memory. Keep document processing client-side.

**Why:** The user explicitly identified multi-file resets and large uploads as core problems; actual maximum file size still depends on browser and device memory.

**How to apply:** Preserve the current tool while files are added, test batches beyond two files, reduce avoidable full-buffer copies, and state file and batch limits without promising that every device can process every file.

Page-editing work must remain separate for each selected document when users switch between documents. The user expects rotation, deletion, copying, and ordering controls in Organize, Image to PDF, and PDF to Image, with additional-file selection.

**Why:** The user reported losing earlier document edits after selecting a second document and returning to the first.

**How to apply:** Keep existing page edits when switching documents or appending inputs. Do not interpret document selection as an instruction to reset edits.
