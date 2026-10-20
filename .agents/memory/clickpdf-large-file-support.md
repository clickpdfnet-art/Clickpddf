---
name: ClickPDF large-file and batch expectations
description: Product requirements for multi-file processing and large client-side documents.
---

ClickPDF should let users add multiple files without leaving or resetting the selected tool. The user requests no fixed file-count or upload-size cap, including selections of 20+ files and individual files of 50, 100, 200, 500, 600, and 1000 MB. Keep document processing client-side.

**Why:** The user repeatedly identified multi-file resets and large uploads as core problems and specifically asked to use available device RAM, processor, graphics, and disk resources. Successful processing still depends on browser and device memory.

**How to apply:** Preserve the current tool while files are added, test batches beyond two files, and reduce avoidable full-buffer copies. Distinguish uncapped file selection from successful processing; never promise unlimited processing or universal 1 GB support. Do not claim GPU acceleration or streaming unless the operation actually uses it. Do not silently move document processing to a server.

Page-editing work must remain separate for each selected document when users switch between documents. The user expects rotation, deletion, copying, and ordering controls in Organize, Image to PDF, and PDF to Image, with additional-file selection.

**Why:** The user reported losing earlier document edits after selecting a second document and returning to the first.

**How to apply:** Keep existing page edits when switching documents or appending inputs. Do not interpret document selection as an instruction to reset edits.

Every tool must perform its named operation; an unimplemented operation must fail explicitly rather than compressing only the first selected file and claiming success or standards compliance.

**Why:** The all-tool audit exposed misleading fallback behavior, including an unsupported PDF/A operation. A valid PDF is not evidence of a correct operation or archival compliance.

**How to apply:** Verify meaningful output semantics and batch output counts. Keep admission tests, actual processing tests, and standards-validation results distinct.

Keep the existing Add files controls; do not introduce an extra universal upload/status card above each tool.

**Why:** The user explicitly requested removal of the duplicate card because the tools already have their own Add files buttons.

**How to apply:** Reuse the original picker controls when fixing batch upload behavior; do not add duplicate upload UI.

Batch memory safety requires releasing completed buffers before starting more work, not just limiting concurrent decoders. PDF page-copy chunking can duplicate shared image/font resources when each chunk creates an independent copier.

**Why:** Retained queue results and repeated copying of shared resources can increase peak memory despite nominally serial or chunked processing.

**How to apply:** Stage outputs before advancing to the next document, avoid retaining a second results collection, and preserve shared resource identity across all pages from each source document.

The default Recommended compression option must attempt meaningful size reduction, not treat an unchanged metadata-only rewrite as sufficient.

**Why:** The user reported that Medium and the other presets work but the automatically selected Recommended option leaves MB unchanged.

**How to apply:** Keep Recommended as the gentler visual-quality choice, distinguish it from explicit lossless optimization, disclose visual-compression tradeoffs, and report unchanged output honestly.
