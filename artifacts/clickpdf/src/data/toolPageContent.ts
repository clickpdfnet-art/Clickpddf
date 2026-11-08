type ToolFaqContent = {
  question: string;
  answer: string;
};

type ToolHowToContent = {
  step: number;
  title: string;
  description: string;
};

export type ToolPageContent = {
  introHeading?: string;
  intro?: string;
  stepsHeading: string;
  steps: ToolHowToContent[];
  faqs: ToolFaqContent[];
};

/**
 * Canonical English FAQ and How-to content for the 21 public PDF tools.
 * These records override legacy inline FAQ/step copy in toolSeoData.ts.
 * Keep every answer aligned with the tool implementation and visible UI.
 */
export const TOOL_PAGE_CONTENT: Record<string, ToolPageContent> = {
  merge: {
    stepsHeading: 'How to Merge PDF Files in Three Steps',
    steps: [
      { step: 1, title: 'Add the PDF files', description: 'Select one or more PDF documents from your device or drop them into the merge workspace.' },
      { step: 2, title: 'Set the document order', description: 'Drag files into sequence or use the available sort controls before combining them.' },
      { step: 3, title: 'Merge and review', description: 'Create and download the combined PDF, then check page order and any links, forms, or annotations you need.' },
    ],
    faqs: [
      { question: 'Can I use Merge PDF with just one file?', answer: 'Yes. Merge PDF accepts one or more PDF files. Processing a single file creates a separate PDF copy. Select two or more PDFs only when you want to combine documents. Your original files are not changed.' },
      { question: 'Can I change the file sequence before combining PDFs?', answer: 'Yes. Reorder whole PDF files in the workspace using drag-and-drop or the available ordering controls. Preview each source PDF and check its pages before starting. Merge PDF keeps the pages within each source file in their existing order; use Organize Pages on a PDF first if you need to change its page order. Merge PDF has no password-entry option for standard encrypted PDFs; provide a readable, unlocked copy. ClickPDF’s Unlock PDF feature handles ClickPDF Web Crypto-protected files, not arbitrary standard PDF encryption.' },
      { question: 'Will links, forms, and annotations behave exactly as before?', answer: 'Their behavior can vary between PDFs and viewers, so review the merged output. The merger copies page objects and AcroForm data, and renames later duplicate form-field names. Dynamic XFA forms and digitally signed PDFs cannot be safely merged and are rejected.' },
      { question: 'Can one merged PDF contain pages with different sizes?', answer: 'Yes. PDFs with different page dimensions can be combined. Page sizes are not normalized, so pages may look different in a viewer or when printed. Review the output before sharing it.' },
      { question: 'Does merging overwrite any of my original PDFs?', answer: 'No. Merge PDF creates a separate output and reads the selected files in the browser. The page may still make network requests for resources and enabled services; that is separate from sending PDF contents to a processing server.' },
      { question: 'What affects how quickly a large merge finishes?', answer: 'Processing time and success depend on the number and size of the PDFs and the memory available in your browser and device. There is no fixed file-size or page-count cap in the reviewed code, but browser memory is a practical limit. Try fewer or smaller PDFs if processing fails. Merging is not a compression operation, so the output may not be smaller.' },
    ],
  },
  split: {
    stepsHeading: 'How to Split a PDF into Selected Pages',
    steps: [
      { step: 1, title: 'Choose the source PDF', description: 'Open the PDF you want to divide in the Split PDF workspace.' },
      { step: 2, title: 'Choose pages or ranges', description: 'Enter the page numbers or ranges to extract, or select the option that splits the document into individual pages.' },
      { step: 3, title: 'Create and save the results', description: 'Run the split, then download the resulting PDF files individually or in the offered ZIP package.' },
    ],
    faqs: [
      { question: 'Can I extract pages that are not next to each other?', answer: 'Yes. Enter the page numbers or ranges supported by the page-selection control, then review the selection before processing.' },
      { question: 'How do I make a separate PDF for every page?', answer: 'Choose the split-every-page mode if it is available in the workspace. The tool creates separate page files, which can be downloaded together as a ZIP.' },
      { question: 'Will the extracted pages stay in their original order?', answer: 'The output follows the selected page sequence. Check the page list before splitting if you need a particular order.' },
      { question: 'Does splitting a scanned PDF add searchable text?', answer: 'No. Splitting separates existing pages; it does not run OCR. Scanned pages remain scans unless you process them with an OCR tool separately.' },
      { question: 'Are the pages removed from my original document?', answer: 'No. Splitting creates new output files and does not overwrite the source PDF.' },
      { question: 'What can slow down a large page extraction?', answer: 'Long PDFs and large page images can use substantial device memory. Processing speed depends on the file, browser, and available memory.' },
    ],
  },
  compress: {
    stepsHeading: 'How to Compress a PDF and Check the Result',
    steps: [
      { step: 1, title: 'Select the PDF to reduce', description: 'Add the PDF whose file size you want to review and reduce.' },
      { step: 2, title: 'Choose an available setting', description: 'Select one of the compression options shown by the tool; the result depends on the source document and setting.' },
      { step: 3, title: 'Compare and download', description: 'Check the resulting file size and readability, then save the compressed PDF as a separate file.' },
    ],
    faqs: [
      { question: 'Can Compress PDF guarantee a specific target size?', answer: 'No. The amount of reduction depends on the document’s images, fonts, and existing compression. A target such as 200 KB cannot be guaranteed.' },
      { question: 'Will compression make text or images less clear?', answer: 'It can, depending on the source PDF and selected option. Compare important text, diagrams, and images with the original before using the result.' },
      { question: 'Which compression choices can I select?', answer: 'Use the settings currently displayed in the compressor. Their names and effects depend on the options available in the tool; do not assume a setting can preserve every detail.' },
      { question: 'Can compressing a PDF leave its size unchanged?', answer: 'Yes. Some PDFs are already compact or contain little data that can be reduced, so the output may be only slightly smaller or remain similar in size.' },
      { question: 'Does the compressor replace my original file?', answer: 'No. Download the processed output as a separate PDF and keep the source until you have checked the new copy.' },
      { question: 'Why might a photo-heavy PDF take longer to process?', answer: 'Large images require more browser memory and processing than text-only pages. The time also depends on your device and the chosen compression option.' },
    ],
  },
  'jpg-to-pdf': {
    stepsHeading: 'How to Convert JPG, PNG, or WebP Images to PDF',
    steps: [
      { step: 1, title: 'Add the images', description: 'Select JPG, PNG, or WebP files from your device and check that every intended image appears in the workspace.' },
      { step: 2, title: 'Arrange pages and layout', description: 'Set the image order and choose the available page orientation and margin options.' },
      { step: 3, title: 'Generate and download the PDF', description: 'Convert the selected images, download the resulting PDF, then check page order, orientation, and fit.' },
    ],
    faqs: [
      { question: 'Which image formats can I turn into a PDF?', answer: 'The tool accepts JPG, PNG, and WebP images. Check the file picker and confirm that each selected image is listed before conversion.' },
      { question: 'Can several photos go into one PDF?', answer: 'Yes. Add multiple supported images; the selected images are placed into the resulting PDF as pages.' },
      { question: 'How do I control the order of image pages?', answer: 'Arrange the images in the order you want in the workspace before converting. Review the finished PDF to confirm the sequence.' },
      { question: 'Can I adjust page orientation or margins?', answer: 'Use the orientation and margin controls offered by the tool. The available layout choices determine how each image is placed on its PDF page.' },
      { question: 'Will the PDF improve the resolution of a small photo?', answer: 'No. Conversion does not add detail that is absent from the source image. Check the output at the size you plan to print or share.' },
      { question: 'Does creating the PDF change the original images?', answer: 'No. The PDF is a new output; the selected image files remain on your device.' },
    ],
  },
  'pdf-to-image': {
    stepsHeading: 'How to Export PDF Pages as PNG Images',
    steps: [
      { step: 1, title: 'Add the PDF documents', description: 'Select the PDF files whose pages you want to export as images.' },
      { step: 2, title: 'Review pages and export options', description: 'Choose the pages and available page adjustments in the workspace before starting the PNG export.' },
      { step: 3, title: 'Download the PNG output', description: 'Export the pages and save the generated PNG files; when offered, download multiple results as a ZIP.' },
    ],
    faqs: [
      { question: 'Does this tool export PDF pages as PNG or JPG?', answer: 'The current tool exports pages as PNG images. It does not create editable text files from the page images.' },
      { question: 'Can I export only selected pages from a PDF?', answer: 'Use the page controls in the workspace to choose the pages for export, then verify the selection before processing.' },
      { question: 'How are images from several PDFs organized?', answer: 'The export may package multiple results in a ZIP. Review the generated folders and filenames to match each image with its source document.' },
      { question: 'Can I edit the text in an exported PNG?', answer: 'No. A PNG is a raster image of a page, not an editable text document. Use a text or document-conversion tool when you need editable content.' },
      { question: 'What can affect the clarity of a page image?', answer: 'The source PDF and the rendering settings determine the visible detail. Zoom in on small text in the downloaded PNG before relying on it.' },
      { question: 'Why can a long PDF take more memory to export?', answer: 'Every exported page creates image data in the browser. Large documents and high-detail pages can require more device memory and time.' },
    ],
  },
  rotate: {
    stepsHeading: 'How to Rotate PDF Pages and Save a Copy',
    steps: [
      { step: 1, title: 'Open the PDF', description: 'Select the document and wait for its page previews to appear in the rotation workspace.' },
      { step: 2, title: 'Choose pages and direction', description: 'Use the page controls to rotate individual pages or apply the available rotation to the whole document.' },
      { step: 3, title: 'Save and inspect the PDF', description: 'Download the rotated copy and check the affected pages in a PDF viewer.' },
    ],
    faqs: [
      { question: 'Can I rotate one page without rotating every page?', answer: 'Yes. Use the controls on the individual page when only one page needs correction; the whole-document control applies to all pages.' },
      { question: 'Can the same rotation be applied to every page?', answer: 'Use the rotate-all control shown in the workspace. Review the page previews first so correctly oriented pages are not changed unnecessarily.' },
      { question: 'Does rotation change the content of a page?', answer: 'Rotation changes the page orientation, not the text or image content itself. Inspect the saved copy to ensure nothing appears clipped or awkward.' },
      { question: 'Can I undo a wrong rotation before saving?', answer: 'Use the page rotation controls again to correct the orientation before downloading. Reopen the source if you want to start over.' },
      { question: 'Will Rotate PDF overwrite my source file?', answer: 'No. The tool produces a separate rotated PDF for download; the original remains unchanged on your device.' },
      { question: 'Why might page previews load slowly?', answer: 'Rendering thumbnails uses browser memory. Large PDFs or image-heavy pages can take longer depending on the device.' },
    ],
  },
  watermark: {
    stepsHeading: 'How to Add a Text Watermark to a PDF',
    steps: [
      { step: 1, title: 'Select the PDF', description: 'Open the document that should receive a visible text watermark.' },
      { step: 2, title: 'Set the text and appearance', description: 'Enter the watermark wording, adjust the available color, angle, opacity, and page-target settings.' },
      { step: 3, title: 'Apply and review', description: 'Generate the watermarked PDF and check that the mark is legible without obscuring important content.' },
    ],
    faqs: [
      { question: 'Can I use a logo image as the watermark?', answer: 'This ClickPDF tool adds text watermarks. It does not provide image-logo watermarking, so use a tool that explicitly supports image marks for that task.' },
      { question: 'Can the watermark appear on only certain pages?', answer: 'Choose the page targets offered in the workspace before applying the mark. Review the output to confirm which pages received it.' },
      { question: 'Which appearance settings are available for the text mark?', answer: 'The tool provides text styling controls such as color, angle, and opacity. Use the controls shown in the current workspace.' },
      { question: 'Does a watermark hide or remove the original page content?', answer: 'No. A visible text mark is not redaction or secure deletion; underlying document content may still be readable or extractable.' },
      { question: 'Can a light watermark still be seen on every background?', answer: 'Visibility depends on the watermark color, opacity, and page content. Check pages with different backgrounds before sharing the result.' },
      { question: 'Will the original PDF be changed?', answer: 'No. Applying the watermark creates a separate output PDF. Keep the source if you may need an unmarked copy.' },
    ],
  },
  'page-numbers': {
    stepsHeading: 'How to Add Page Numbers to a PDF',
    steps: [
      { step: 1, title: 'Open the document', description: 'Select the PDF that needs page numbers and review its page count.' },
      { step: 2, title: 'Choose numbering options', description: 'Set the available position, format, starting number, and cover-page behavior.' },
      { step: 3, title: 'Apply and check placement', description: 'Create the numbered PDF and inspect pages for overlaps with existing text or page content.' },
    ],
    faqs: [
      { question: 'Can numbering start at a number other than one?', answer: 'Set the starting value in the numbering options when the control is available, then check the first numbered page in the output.' },
      { question: 'Can I leave a cover page without a printed number?', answer: 'Use the cover-page option if shown in the tool. Confirm the first visible number and later sequence after processing.' },
      { question: 'Where can the page number be placed?', answer: 'Choose from the positions offered by the workspace, such as the available header or footer alignments.' },
      { question: 'Can the numbers cover existing text?', answer: 'They may overlap content if the chosen position is occupied. Review pages with footers, headers, or dense content and adjust the placement.' },
      { question: 'Does adding numbers change the original PDF?', answer: 'No. The tool creates a separate numbered copy; your input PDF is not overwritten.' },
      { question: 'Are page numbers added to every page automatically?', answer: 'The result follows the page and cover settings you select. Review the output to confirm the intended pages and numbering sequence.' },
    ],
  },
  organize: {
    stepsHeading: 'How to Reorder, Rotate, or Delete PDF Pages',
    steps: [
      { step: 1, title: 'Load the PDF pages', description: 'Select a PDF and wait for its page thumbnails to appear in the organizer.' },
      { step: 2, title: 'Make page-level changes', description: 'Drag thumbnails to reorder pages, use rotation controls where needed, or remove pages you do not want.' },
      { step: 3, title: 'Save and verify the copy', description: 'Download the reorganized PDF and check its order and page count; keep the original until you finish reviewing.' },
    ],
    faqs: [
      { question: 'How do I move a page to a new position?', answer: 'Drag its thumbnail to the intended place in the page grid, then inspect the sequence before saving.' },
      { question: 'Can I remove several unwanted pages?', answer: 'Use the page removal control for each page you want excluded, then confirm the resulting page count before downloading.' },
      { question: 'Does deleting a page securely erase its contents?', answer: 'No. Removing a page from the output is not a substitute for secure redaction of sensitive information elsewhere in a document.' },
      { question: 'Can I rotate a page while organizing the PDF?', answer: 'The organizer includes page rotation controls. Use them on the relevant thumbnails and review the saved pages for correct orientation.' },
      { question: 'Can I restore the original order after changes?', answer: 'Reopen the original PDF to start from its unchanged page sequence. The source is not overwritten by the reorganized output.' },
      { question: 'Why might a large document take time to display thumbnails?', answer: 'The browser must render page previews. Long documents and image-heavy pages can use more memory and load more slowly.' },
    ],
  },
  'edit-metadata': {
    stepsHeading: 'How to Edit Supported PDF Metadata Fields',
    steps: [
      { step: 1, title: 'Open the PDF properties', description: 'Select a PDF and review the supported metadata fields displayed by the tool.' },
      { step: 2, title: 'Edit or clear selected fields', description: 'Update the Title, Author, Subject, Keywords, Creator, or Producer fields as needed.' },
      { step: 3, title: 'Save and inspect the result', description: 'Download the edited PDF and check its properties as well as its visible pages before sharing.' },
    ],
    faqs: [
      { question: 'Which PDF metadata fields can I edit here?', answer: 'The tool supports Title, Author, Subject, Keywords, Creator, and Producer. Other metadata fields may remain unchanged.' },
      { question: 'Does clearing supported fields make a PDF anonymous?', answer: 'No. Clearing those fields does not guarantee anonymity. Other metadata, visible content, comments, attachments, or identifying details may remain.' },
      { question: 'Will metadata editing remove words from the PDF pages?', answer: 'No. The tool edits supported document properties; it does not redact or erase visible text from page content.' },
      { question: 'Does the tool clear every XMP property or embedded comment?', answer: 'No such guarantee is made. The operation is limited to the supported fields displayed in the interface.' },
      { question: 'Can I check the changed properties before sharing?', answer: 'Yes. Download the result and inspect its document properties with a PDF viewer or metadata reader before distributing it.' },
      { question: 'Are metadata changes made to my original file?', answer: 'The tool creates a processed output rather than overwriting the source file. Keep the original until you confirm the result.' },
    ],
  },
  metadata: {
    stepsHeading: 'How to Run PDF OCR and Check Page Details',
    steps: [
      { step: 1, title: 'Select a PDF for analysis', description: 'Open the scanned or text-based PDF whose page details or text you need to inspect.' },
      { step: 2, title: 'Run the available analysis', description: 'Start OCR for scanned content and review the page count, dimensions, and extracted text shown by the tool.' },
      { step: 3, title: 'Copy or download the result', description: 'Check the recognized text, then copy it or save the available text output; the source PDF is not rewritten as searchable.' },
    ],
    faqs: [
      { question: 'Does OCR analysis turn the original PDF into a searchable file?', answer: 'No. The tool can show recognized text for review, but it does not add a searchable text layer to the source PDF.' },
      { question: 'Which page details can I check?', answer: 'The analyzer reports details such as page count and page dimensions, alongside any OCR text it extracts.' },
      { question: 'Why can OCR miss words in a scanned page?', answer: 'Recognition depends on scan resolution, contrast, skew, and the text itself. Carefully proofread names, numbers, and other critical content.' },
      { question: 'Can I copy the recognized text out of the tool?', answer: 'Yes. Review the extracted result and use the available copy or text-download control.' },
      { question: 'Will handwriting be recognized as reliably as printed text?', answer: 'Not necessarily. OCR is intended for printed text, and handwriting or poor-quality scans may produce incomplete or incorrect results.' },
      { question: 'Does analysis upload my PDF for OCR?', answer: 'Supported document processing runs in your browser. The page may still request resources and enabled third-party services; this is not a promise of zero network requests.' },
    ],
  },
  protect: {
    stepsHeading: 'How to Protect a PDF with ClickPDF Protect',
    steps: [
      { step: 1, title: 'Choose the PDF', description: 'Select the document you want to place in the ClickPDF Protect format.' },
      { step: 2, title: 'Set a password', description: 'Enter a password in the protection workspace and check it carefully before creating the protected file.' },
      { step: 3, title: 'Download the protected file', description: 'Save the output and retain the password; use ClickPDF Unlock to open this ClickPDF-protected format later.' },
    ],
    faqs: [
      { question: 'Does Protect PDF add a standard PDF password?', answer: 'No. ClickPDF Protect creates a custom encrypted wrapper; it is not the standard password-protection feature used by ordinary PDF readers.' },
      { question: 'Can Adobe Acrobat or another PDF viewer open the protected output directly?', answer: 'The custom protected file is intended to be opened with ClickPDF Unlock and the correct password, not treated as a regular PDF by every viewer.' },
      { question: 'What happens if I forget the password?', answer: 'The password is required to unlock the protected file. Keep it somewhere secure; the tool does not promise password recovery or bypass.' },
      { question: 'Is the source PDF overwritten when it is protected?', answer: 'No. Download the protected output as a separate file and keep the original according to your own security requirements.' },
      { question: 'Is this the same as redacting sensitive text?', answer: 'No. Protection changes access to the custom output; it does not remove sensitive text from the original PDF or replace a proper redaction workflow.' },
      { question: 'Where can I open a file created by ClickPDF Protect?', answer: 'Use ClickPDF Unlock with the password that was set during protection. Do not assume compatibility with unrelated PDF decryption tools.' },
    ],
  },
  unlock: {
    stepsHeading: 'How to Unlock a ClickPDF-Protected File',
    steps: [
      { step: 1, title: 'Select the protected file', description: 'Open the file created by ClickPDF Protect in the Unlock PDF workspace.' },
      { step: 2, title: 'Enter its password', description: 'Type the password set when the file was protected and check for typing errors.' },
      { step: 3, title: 'Decrypt and save', description: 'Run the unlock process and download the resulting PDF, then open it to verify the pages.' },
    ],
    faqs: [
      { question: 'Can Unlock PDF remove a password from any PDF?', answer: 'No. It is for the custom protected files created by ClickPDF Protect; it does not bypass passwords on arbitrary standard PDFs.' },
      { question: 'Do I need the same password used during protection?', answer: 'Yes. Enter the correct password associated with that ClickPDF-protected file to decrypt it.' },
      { question: 'Will a wrong password recover or reset the file?', answer: 'No. A wrong password cannot unlock the protected content, and the tool does not provide a password bypass or reset.' },
      { question: 'Can I open the protected file in a normal PDF reader first?', answer: 'The custom wrapper is not a regular PDF until it has been unlocked. Use ClickPDF Unlock, then open the resulting PDF in a compatible viewer.' },
      { question: 'Does unlocking change the protected source file?', answer: 'No. The tool produces an unlocked output; keep or remove the protected input based on your own needs.' },
      { question: 'Are protected file contents sent to a document server?', answer: 'Supported file processing runs in the browser. The webpage may still request its resources and enabled third-party services.' },
    ],
  },
  'pdf-to-text': {
    stepsHeading: 'How to Extract Text from a PDF as TXT or Markdown',
    steps: [
      { step: 1, title: 'Open a PDF with text', description: 'Select the document whose selectable text you want to extract.' },
      { step: 2, title: 'Choose an output format', description: 'Select TXT or Markdown from the formats available in the text extraction workspace.' },
      { step: 3, title: 'Review and export the text', description: 'Inspect the extracted result, then copy it or download the selected text file.' },
    ],
    faqs: [
      { question: 'Can PDF to Text read a page that is only a scan?', answer: 'Image-only pages do not contain selectable text for this extractor. Run OCR separately first if you need text recognized from a scan.' },
      { question: 'Should I choose TXT or Markdown?', answer: 'TXT is plain text; Markdown can retain simple structure such as headings and lists where they can be inferred. Review the result for layout changes.' },
      { question: 'Will tables keep their exact columns after extraction?', answer: 'Not always. Complex tables, multi-column pages, and unusual reading order may need manual cleanup in the extracted text.' },
      { question: 'Can I copy the extracted text without downloading a file?', answer: 'Yes. Use the copy control in the workspace, or download the available TXT or Markdown output.' },
      { question: 'Does extracting text alter the PDF?', answer: 'No. Text extraction creates or copies a separate text result and does not overwrite the source document.' },
      { question: 'Why does extraction time vary between PDFs?', answer: 'Page count, document structure, and browser memory affect processing. Image-heavy documents may take longer even when only text is needed.' },
    ],
  },
  'pdf-to-word': {
    stepsHeading: 'How to Convert a PDF into an Editable Word File',
    steps: [
      { step: 1, title: 'Select the PDF document', description: 'Add the PDF you want to convert to a DOCX file.' },
      { step: 2, title: 'Choose the conversion path', description: 'Use editable text conversion by default; select the clearly labeled image fallback only when page appearance matters more than editable text.' },
      { step: 3, title: 'Download and review the DOCX', description: 'Open the result in Word or a compatible editor and check text, page breaks, and formatting.' },
    ],
    faqs: [
      { question: 'Will the converted Word document be editable?', answer: 'Editable text is the default conversion path. Formatting and reading order can change, so review the DOCX in a word processor.' },
      { question: 'What does the image fallback do?', answer: 'The optional image fallback prioritizes how pages look by placing page images in the DOCX. Those page images are not the same as editable Word text.' },
      { question: 'Can scanned PDFs convert into editable words automatically?', answer: 'Image-only scans need OCR before their text can be extracted. Without recognized text, a conversion cannot reliably produce editable words from the scan.' },
      { question: 'Will tables and columns keep their original layout?', answer: 'Complex layouts may not map exactly into Word. Check tables, columns, headers, and page breaks in the generated file.' },
      { question: 'Does conversion overwrite my PDF?', answer: 'No. The tool creates a DOCX output and leaves the original PDF unchanged.' },
      { question: 'Can I convert a large PDF on a phone?', answer: 'It depends on browser memory and the document. Large files may work better on a device with more available memory.' },
    ],
  },
  'pdf-to-excel': {
    stepsHeading: 'How to Extract PDF Tables into an Excel Workbook',
    steps: [
      { step: 1, title: 'Select a PDF containing tables', description: 'Choose a document with readable table text or clearly separated rows and columns.' },
      { step: 2, title: 'Run table extraction', description: 'Start the conversion and review how the tool has grouped the detected table content.' },
      { step: 3, title: 'Download and check the XLSX', description: 'Open the workbook and verify row order, column alignment, and numeric values before using it.' },
    ],
    faqs: [
      { question: 'Can PDF to Excel extract tables from a scanned document?', answer: 'Scanned pages may not contain selectable characters for table extraction. OCR may be needed first, and the resulting rows still require review.' },
      { question: 'Will the spreadsheet preserve the PDF table layout exactly?', answer: 'No exact layout match is guaranteed. The tool extracts table data into a workbook, so check columns, merged cells, and reading order.' },
      { question: 'Are formulas from the original PDF restored in Excel?', answer: 'A PDF generally contains displayed content rather than the original spreadsheet formulas. Review the extracted cells and do not assume formulas are recreated.' },
      { question: 'Can one PDF produce more than one table in the workbook?', answer: 'The tool attempts to detect table structure, but results depend on how the source PDF lays out its data. Inspect every extracted table.' },
      { question: 'Does the converter change my PDF file?', answer: 'No. The output is a separate XLSX workbook; the source PDF remains unchanged.' },
      { question: 'What should I verify before using extracted figures?', answer: 'Check totals, decimal points, dates, row associations, and column headings against the source PDF, especially for financial or scanned documents.' },
    ],
  },
  'pdf-to-powerpoint': {
    stepsHeading: 'How to Convert PDF Pages into PowerPoint Slides',
    steps: [
      { step: 1, title: 'Choose the PDF file', description: 'Select the PDF whose pages you want to place into a PowerPoint presentation.' },
      { step: 2, title: 'Run the slide conversion', description: 'Start the conversion so the tool can map the PDF page content into a PPTX file.' },
      { step: 3, title: 'Open and inspect the slides', description: 'Download the presentation and check each slide’s text, layout, and editability in PowerPoint or a compatible app.' },
    ],
    faqs: [
      { question: 'Does a PDF contain the original PowerPoint objects?', answer: 'Usually not. A PDF does not preserve the original slide master, animations, speaker notes, or editing structure, so the converted deck may differ.' },
      { question: 'Will each PDF page become a presentation slide?', answer: 'The conversion maps PDF page content into a PPTX presentation. Review the deck to confirm the page-to-slide sequence.' },
      { question: 'Can I edit text after conversion?', answer: 'Editability depends on how text and graphics were represented in the PDF and output. Check individual slides before planning further edits.' },
      { question: 'Will the slide layout match the PDF page exactly?', answer: 'The page and slide proportions can differ, so margins or content placement may change. Inspect the exported slides at presentation size.' },
      { question: 'Does converting to PPTX modify the source PDF?', answer: 'No. The presentation is a separate output file.' },
      { question: 'What can slow down a long PDF presentation conversion?', answer: 'More pages and complex visual content require additional browser processing and memory. Large documents may take longer on mobile devices.' },
    ],
  },
  'word-to-pdf': {
    stepsHeading: 'How to Convert a DOCX Document into a PDF',
    steps: [
      { step: 1, title: 'Select a DOCX file', description: 'Choose a modern .docx document; legacy .doc files are not accepted by this tool.' },
      { step: 2, title: 'Convert the document pages', description: 'Start the in-browser conversion and wait for the rendered page output.' },
      { step: 3, title: 'Download and inspect the PDF', description: 'Check page breaks, spacing, images, and readability in the resulting PDF before sharing.' },
    ],
    faqs: [
      { question: 'Can Word to PDF convert the older DOC format?', answer: 'The tool accepts DOCX files. Open a legacy DOC document in a word processor and save it as DOCX before converting.' },
      { question: 'Is text in the converted PDF selectable?', answer: 'This tool renders output pages as images, so text may not be selectable or searchable like text in a native PDF.' },
      { question: 'Why can the PDF layout look different from Word?', answer: 'Font availability, page setup, tables, and embedded images can affect browser rendering. Compare the output with the source document.' },
      { question: 'Should I check page breaks before submitting?', answer: 'Yes. Review every page for unexpected breaks, clipped content, or spacing changes before using the PDF.' },
      { question: 'Does conversion alter the DOCX source?', answer: 'No. The converted PDF is a separate file; the original DOCX remains unchanged.' },
      { question: 'Can a large DOCX be converted on a mobile device?', answer: 'That depends on the browser and available device memory. Large documents with many images may be slower to render.' },
    ],
  },
  'word-to-excel': {
    stepsHeading: 'How to Extract DOCX Tables into Excel',
    steps: [
      { step: 1, title: 'Choose a DOCX document', description: 'Select one or more .docx files that contain tables you want to move into a workbook.' },
      { step: 2, title: 'Extract tables and text', description: 'Run the conversion and review the detected tables and any separately collected document text.' },
      { step: 3, title: 'Download the workbook files', description: 'Save the generated XLSX workbook, or the ZIP package when multiple documents are processed.' },
    ],
    faqs: [
      { question: 'Can Word to Excel read a DOC file?', answer: 'The converter accepts DOCX. Save an older DOC file in DOCX format before selecting it.' },
      { question: 'Where do the extracted tables appear?', answer: 'Detected tables are placed into workbook sheets. Check the sheet names and table boundaries after opening the XLSX.' },
      { question: 'What happens to paragraphs that are not in tables?', answer: 'The conversion can collect document paragraphs and lists separately in a text worksheet. Review that sheet for omitted or reordered content.' },
      { question: 'How are multiple Word documents delivered?', answer: 'When multiple documents are processed, the results can be packaged as a ZIP. Open the archive and match each workbook to its source.' },
      { question: 'Will fonts and table styling be preserved in Excel?', answer: 'The conversion focuses on extracting data, not reproducing Word page design. Check cell contents and structure rather than expecting identical styling.' },
      { question: 'Does the tool change the source DOCX files?', answer: 'No. The XLSX or ZIP result is separate from your original Word documents.' },
    ],
  },
  'excel-to-pdf': {
    stepsHeading: 'How to Convert an Excel or CSV File to PDF',
    steps: [
      { step: 1, title: 'Select a spreadsheet file', description: 'Choose a supported XLSX, XLS, or CSV document from your device.' },
      { step: 2, title: 'Generate the paginated output', description: 'Start the conversion and allow the tool to lay the spreadsheet content out across PDF pages.' },
      { step: 3, title: 'Review the PDF pages', description: 'Download the PDF and check column widths, page breaks, and any rows that span multiple pages.' },
    ],
    faqs: [
      { question: 'Which spreadsheet formats can Excel to PDF open?', answer: 'The tool accepts XLSX, XLS, and CSV files. Confirm the file type in the picker if a document does not appear.' },
      { question: 'Will a wide spreadsheet fit on one PDF page?', answer: 'Not necessarily. The generated PDF is paginated; inspect wide columns and page breaks and adjust the spreadsheet if needed.' },
      { question: 'Are spreadsheet formulas recalculated during conversion?', answer: 'Do not assume the converter reproduces Excel’s calculation engine. Check displayed values against the source workbook before relying on them.' },
      { question: 'Can I check the PDF before sending it?', answer: 'Yes. Open the downloaded result and review every page for clipped columns, small text, and awkward breaks.' },
      { question: 'Does making a PDF change my workbook?', answer: 'No. The PDF is a separate output and the source spreadsheet remains unchanged.' },
      { question: 'Why does a large workbook take longer to export?', answer: 'More rows, columns, and sheets can increase browser processing and memory use. Performance also depends on your device.' },
    ],
  },
  sign: {
    stepsHeading: 'How to Add a Visual Signature Mark to a PDF',
    steps: [
      { step: 1, title: 'Open the PDF to sign', description: 'Select the document and go to the page where the visible signature mark belongs.' },
      { step: 2, title: 'Create and place the mark', description: 'Draw, type, or upload a PNG signature image, then position and resize it on the page.' },
      { step: 3, title: 'Download and verify', description: 'Save the signed copy and check that the mark is correctly placed on the intended page.' },
    ],
    faqs: [
      { question: 'Can I draw or type a signature instead of uploading an image?', answer: 'Yes. The tool supports creating a visible mark by drawing, typing, or uploading a PNG image.' },
      { question: 'Is this a certificate-backed digital signature?', answer: 'No. The tool places a visual signature mark; it does not provide certificate-based signing, identity verification, or a tamper-evident digital signature.' },
      { question: 'Can I move or resize the signature before saving?', answer: 'Yes. Position and resize the mark in the workspace, then inspect its placement on the page before downloading.' },
      { question: 'Does adding a signature mark prove who signed the document?', answer: 'No. A visual mark by itself does not verify identity, consent, or signing authority. Follow the legal or organizational signing process that applies to your document.' },
      { question: 'Will the original PDF be replaced?', answer: 'No. Download the signed output as a separate PDF and keep the source document if you need it.' },
      { question: 'Are signature files uploaded for processing?', answer: 'Supported document processing runs in your browser. The page can still request resources and enabled third-party services.' },
    ],
  },
  crop: {
    introHeading: 'Adjust PDF page margins with the CropBox',
    intro: 'Apply one 0–25% margin to each side of every page. This changes the visible or printable page area only; it does not remove underlying content or securely redact information.',
    stepsHeading: 'How to Crop PDF Margins in Three Steps',
    steps: [
      { step: 1, title: 'Add the PDF files', description: 'Select one or more PDFs whose visible page area you want to adjust.' },
      { step: 2, title: 'Choose a uniform margin', description: 'Set a percentage from 0 to 25. The same amount is applied to all four sides of every page.' },
      { step: 3, title: 'Save and inspect the copies', description: 'Download the cropped PDF or ZIP and check every page in a PDF viewer.' },
    ],
    faqs: [
      { question: 'Does cropping erase the content outside the page area?', answer: 'No. The tool updates the PDF CropBox, which controls the visible or printable area. Content outside that box may remain in the file.' },
      { question: 'Can I crop each page by a different amount?', answer: 'No. This tool applies one uniform percentage to all four sides of every page in each selected file.' },
      { question: 'Can cropping securely hide sensitive information?', answer: 'No. Cropping is not redaction and does not guarantee deletion of hidden content. Use a verified redaction tool and check the result before sharing.' },
      { question: 'What does the margin percentage mean?', answer: 'The selected percentage is measured against each page’s smaller dimension and is removed from each side.' },
      { question: 'Will the source PDF be overwritten?', answer: 'No. The tool creates a separate output file and leaves the selected source file unchanged.' },
      { question: 'Can I process several PDFs together?', answer: 'Yes. The tool processes each selected PDF with the same margin and packages multiple results in a ZIP file.' },
    ],
  },
  repair: {
    introHeading: 'Try a best-effort rebuild of a readable PDF',
    intro: 'The tool asks the PDF parser to load the document in best-effort mode, saves a new copy, and verifies that it can reopen with the same page count. It cannot reconstruct arbitrary damage or missing content.',
    stepsHeading: 'How to Try a Best-Effort PDF Rebuild',
    steps: [
      { step: 1, title: 'Select the PDF', description: 'Choose the document the parser should attempt to read and rebuild.' },
      { step: 2, title: 'Create a rebuilt copy', description: 'Run the operation. A new file is created only if the document can be loaded and the saved copy passes the reopen check.' },
      { step: 3, title: 'Download and inspect the output', description: 'Download the rebuilt copy, then compare important pages and content with the original.' },
    ],
    faqs: [
      { question: 'Can this tool repair every damaged PDF?', answer: 'No. It performs a best-effort parser rebuild. Some files will fail to load, and successful output is not proof that every object is intact.' },
      { question: 'What does the verification check?', answer: 'It checks that the saved PDF can be reopened and has the same page count as the loaded source. It does not compare every page or embedded object.' },
      { question: 'Can missing or truncated content be restored?', answer: 'No. A rebuild cannot recreate bytes or page content that are absent from the source file.' },
      { question: 'Does this work on password-protected PDFs?', answer: 'Encrypted files that cannot be opened by the parser are not repaired. Unlock an authorized file first, then try the operation again.' },
      { question: 'Will the original PDF be overwritten?', answer: 'No. The tool creates a separate rebuilt copy. Keep the source until you have checked the result.' },
      { question: 'Should I rely on a successfully rebuilt PDF without checking it?', answer: 'No. Open the output and verify the pages, text, images, and other important content before relying on it.' },
    ],
  },
  compare: {
    introHeading: 'Compare selectable text from two PDF files',
    intro: 'Choose the original PDF first and the revised copy second. The browser extracts selectable text page by page and creates a downloadable report. It does not compare visual layout, images, handwriting, or scanned text without OCR.',
    stepsHeading: 'How to Compare PDF Text in Three Steps',
    steps: [
      { step: 1, title: 'Select the original PDF', description: 'Add the original document first; it is used as the comparison baseline.' },
      { step: 2, title: 'Select the revised PDF', description: 'Add exactly one revised PDF as the second document.' },
      { step: 3, title: 'Download the text report', description: 'Review the page-by-page report and open both PDFs separately to check visual changes.' },
    ],
    faqs: [
      { question: 'What does Compare PDF check?', answer: 'It compares extracted selectable text page by page, labels matching or different text, and includes the extracted text in a downloadable report.' },
      { question: 'Can it compare scanned pages or handwriting?', answer: 'No. Scanned images and handwriting are not read by this tool. OCR is needed before their text can be compared.' },
      { question: 'Does the report show changes to layout, images, or fonts?', answer: 'No. It checks text only. Open the two PDFs in a viewer to inspect formatting, images, page geometry, and other visual differences.' },
      { question: 'How many PDFs should I select?', answer: 'Select exactly two: the original first and the revised copy second.' },
      { question: 'Can PDFs with different page counts be compared?', answer: 'Yes. The report labels pages that appear only in one document and includes the available text for each page.' },
      { question: 'Does the comparison change either PDF?', answer: 'No. It creates a separate text report and does not modify the selected source files.' },
    ],
  },
  'powerpoint-to-pdf': {
    introHeading: 'Create a basic PDF from selectable PowerPoint text',
    intro: 'The converter reads selectable text from .pptx slides and places it on new basic 16:9 PDF pages. Original slide artwork, layout, charts, speaker notes, and animations are not preserved. Legacy .ppt files are not supported.',
    stepsHeading: 'How to Convert PPTX Text to a Basic PDF',
    steps: [
      { step: 1, title: 'Select a .pptx file', description: 'Choose a PowerPoint Open XML presentation. Save older .ppt files as .pptx before using this tool.' },
      { step: 2, title: 'Rebuild text-only pages', description: 'The tool extracts selectable slide text and lays it out on new 16:9 PDF pages.' },
      { step: 3, title: 'Save and review the PDF', description: 'Download the PDF, then check its text, page sequence, and omissions before sharing it.' },
    ],
    faqs: [
      { question: 'Does the PDF look like the original PowerPoint?', answer: 'No. It is a basic text-only reconstruction. Original slide positions, images, charts, colors, themes, notes, and animations are not reproduced.' },
      { question: 'Which PowerPoint files are supported?', answer: 'The tool accepts .pptx files. Legacy binary .ppt files must be saved as .pptx first.' },
      { question: 'Are all slide text and objects preserved?', answer: 'Selectable text is extracted, but only a limited amount of slide text is placed on each new page. Images and other slide objects are not included.' },
      { question: 'Can text in the output PDF be selected?', answer: 'The generated text is selectable when it is supported by the built-in PDF font. Unsupported characters cause the conversion to stop instead of silently replacing them.' },
      { question: 'Can I use this for a presentation that must keep its design?', answer: 'No. Use PowerPoint or a full-fidelity conversion tool when the original design, diagrams, or placement must be retained.' },
      { question: 'Does conversion change the original presentation?', answer: 'No. The tool creates a separate PDF and leaves the selected .pptx file unchanged.' },
    ],
  },
};
