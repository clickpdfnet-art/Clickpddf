# ClickPDF multilingual tool SEO — batch 1 QA

**Date:** 2026-10-30  
**Status:** First staged batch complete; full 21-language rollout remains incomplete.  
**Deployment:** None. No production checks or Cloudflare deploy were performed.

## Scope completed

This manual batch adds complete localized SEO content for the **Merge PDF** tool in:

- Japanese: `/ja/tools/merge-pdf/`
- Urdu: `/ur/tools/merge-pdf/`
- German: `/de/tools/merge-pdf/`

Each route has its own translated title and description from the existing language catalog, three translated How-to steps, and six translated, tool-specific FAQs. Existing English content and the other tools' current UI translations were retained.

The full non-English matrix contains 420 tool-language pairs (20 non-English languages × 21 tools). Three pairs are complete in this batch; **417 remain**: the other 20 tools in Japanese, Urdu, and German (60 pairs), plus 17 other non-English languages across all 21 tools (357 pairs). No claim is made that all languages or tools are complete.

## Findings and changes

Before this batch, the application parsed only `/tools/:slug`; the page metadata and JSON-LD were English-only; translated tool pages were not generated from the sitemap; and non-English tool content used shared generic How-to and FAQ text.

Changes made:

- Added reviewed Japanese, Urdu, and German Merge PDF content in `artifacts/clickpdf/src/i18n/toolSeoContentTranslations.json`.
- Added lookup and completeness helpers in `artifacts/clickpdf/src/data/toolPageSeoContent.ts`.
- Added locale-aware tool route parsing, language switching, translated visible FAQs/steps, localized metadata, reciprocal hreflang links, and matching `WebPage`, `WebApplication`, `HowTo`, `FAQPage`, and `BreadcrumbList` data.
- Updated static page generation, sitemap generation, and Worker tool-path handling so only completed localized tool pages are generated and listed.
- Added regression checks for visible/schema parity, canonical URLs, language metadata, hreflang/sitemap alternates, and Worker responses.

The static sitemap now includes the 21 existing English tool URLs plus the three completed localized URLs. The English Merge PDF entry and each translated Merge PDF entry list reciprocal `en`, `ja`, `ur`, `de`, and `x-default` alternates. Incomplete language/tool combinations are not added.

## Verification

| Check | Result |
| --- | --- |
| `pnpm --filter @workspace/clickpdf run typecheck` | Passed |
| `pnpm --filter @workspace/clickpdf run build` | Passed; all 22 tests passed |
| `node --test artifacts/clickpdf/scripts/test-cloudflare-tool-routes.mjs` | Passed; all 29 tests passed, including the three localized routes |
| Local mobile preview of `/ja/tools/merge-pdf/` | Rendered Japanese interface and Merge PDF title/description |
| Static FAQ/How-to and JSON-LD comparison | Passed for all three localized routes |
| Sitemap canonical/hreflang checks | Passed |

The build still reports existing Vite warnings about Tesseract.js import chunking and large JavaScript bundles. The preview console also showed one 403 resource response without identifying its URL in the screenshot output; the localized route itself rendered, and that response was not investigated as part of this SEO batch.

## Scope boundaries and remaining work

- No deployment, production change, DNS change, Cloudflare setting change, cache/CSP change, blog change, or PDF-processing change was made.
- The Cloudflare Worker source was adjusted only to recognize localized tool paths and serve their generated static pages.
- Adsterra code and ad placement were not changed.
- Finish the remaining 417 non-English tool-language pairs in manual batches before describing the full rollout as complete.
