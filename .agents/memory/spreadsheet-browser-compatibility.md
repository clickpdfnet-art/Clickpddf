---
name: Spreadsheet browser compatibility
description: SheetJS module imports must be checked in Vite's browser runtime, not only Node or TypeScript.
---

Use a namespace import for SheetJS in browser code, consistent with the existing ClickPDF Office converter.

**Why:** Vite's prebundled `xlsx` exposed named exports without a default export. A default import passed TypeScript and Node-based workbook tests but failed during browser module loading. An eagerly imported tool module can prevent the entire website from loading, not just that tool.

**How to apply:** When adding or changing spreadsheet-related browser imports, verify the actual tool page loads without a runtime overlay. Node workbook round-trip tests are necessary for data validation but do not prove browser module compatibility.
