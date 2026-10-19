# ClickPDF Zero-Config Plugin Architecture

Welcome to the **ClickPDF Zero-Config Tool Plugin System**!

With Vite's `import.meta.glob('/src/tools/plugins/*.tsx', { eager: true })`, any new tool `.tsx` file dropped directly into this folder is automatically detected, compiled, and registered across the entire application without modifying a single line in core files.

---

## What Gets Configured Automatically:
1. **Home Page Grid**: A card for the new tool automatically appears in the Tool Grid under the chosen category (`organize`, `optimize`, `convert`, `edit`, or `security`).
2. **Search Bar**: The tool title, description, and keywords are immediately searchable in the global search bar.
3. **SPA Router**: Dedicated clean URLs are created automatically:
   - `/tools/:slug` (e.g. `/tools/extract-text`)
   - Direct slug: `/:slug` (e.g. `/extract-text`)
   - Query param: `/?tool=:id`
   - Hash route: `#/tools/:slug`
4. **Tool Workspace**: When clicked, the tool automatically loads inside the standard ClickPDF workspace with back button, zero-server privacy badge, and your custom client-side React component.
5. **SEO & Structured Data**: Dynamic `<title>`, `<meta name="description">`, OpenGraph tags, and Schema.org JSON-LD (`WebApplication`, `HowTo`, and `FAQPage`) are generated instantly.
6. **Landing Page SEO Section**: 1-2-3 How-To steps, FAQs, and Related Tools internal linking are rendered below the workspace.

---

## How to Create a New Tool Plugin:
1. Copy `_template.example` to a new file, for example: `src/tools/plugins/extract-text.tsx`
2. Implement your tool adhering to the `ToolPlugin` interface:
   ```tsx
   import React from 'react';
   import { ToolPlugin } from './types';

   const MyToolComponent: React.FC = () => {
     return <div>My 100% In-Browser PDF Tool</div>;
   };

   export const plugin: ToolPlugin = {
     id: 'extract-text',
     slug: 'extract-text',
     title: 'Extract Text from PDF',
     shortDescription: 'Extract plain text and copy content from any PDF file in your browser.',
     category: 'convert',
     iconName: 'FileText',
     badge: 'New',
     seo: {
       metaTitle: 'Extract Text from PDF Online Free – 100% Client-Side',
       metaDescription: 'Extract plain text from your PDF files directly in your browser without uploading to any server.',
       howToSteps: [
         { step: 1, title: 'Choose File', description: 'Select or drop your PDF document.' },
         { step: 2, title: 'Extract Content', description: 'Our local engine reads text instantly.' },
         { step: 3, title: 'Download or Copy', description: 'Copy text or save as a TXT file.' }
       ],
       faqs: [
         { question: 'Is my document private?', answer: 'Yes, all processing occurs 100% in local browser memory.' }
       ]
     },
     Component: MyToolComponent
   };

   export default plugin;
   ```
3. Save the file. Vite instantly auto-discovers and hot-reloads it!
