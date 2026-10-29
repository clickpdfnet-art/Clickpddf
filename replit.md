# ClickPDF

ClickPDF is a privacy-focused browser PDF toolkit for editing, converting, organizing, inspecting, OCR, and document protection.

## Run & Operate

- `pnpm --filter @workspace/clickpdf run dev` — run the ClickPDF web app
- `pnpm --filter @workspace/api-server run dev` — run the shared API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- ClickPDF processes PDF files in the browser and does not require a database or Gemini API key.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/clickpdf/` — ClickPDF web app and browser-based PDF tools
- `artifacts/api-server/` — shared API service
- `artifacts/mockup-sandbox/` — canvas component preview server
- `lib/api-spec/` — shared API contract
- `lib/db/` — shared database package

## Architecture decisions

- PDF operations are client-side; user documents should not be sent to a server.

## SEO & Static Route Contract

- The public tool set comes from `BASE_PDF_TOOLS` after `HIDDEN_TOOL_IDS` filtering; tool SEO, canonical slugs, steps, FAQs, benefits, and related-tool links belong in `TOOL_SEO_REGISTRY`. Keep backup/hidden tools out of public cards, search, sitemap, `llms.txt`, and schema.
- Blog routes are generated from Markdown files in `artifacts/clickpdf/src/blogs/`. Add complete frontmatter, locale/translation metadata where relevant, a clear excerpt, image alt text, canonical route, and links to relevant tools and guides.
- For every new public PDF tool or guide, write original, accurate SEO content: a high-intent title under 60 characters, a meta description under 160 characters, one H1 with a logical H2/H3 hierarchy, three useful How-to steps, five relevant FAQs, key features, and contextual internal links. Do not invent capabilities, limits, encryption compatibility, privacy guarantees, or performance claims; qualify client-side claims to the selected-file processing behavior where appropriate.
- When adding a tool, update relevant existing tools' `relatedToolIds` and related guides' links as well as the tool's own related links. The homepage/category cards derive from the public registry; maintain their destination routes and descriptions.
- `pnpm --filter @workspace/clickpdf run build` generates the sitemap, `llms.txt`, route-specific raw `<head>` metadata and JSON-LD, and semantic HTML fallbacks for every sitemap route. Keep `#root` empty for the existing React `createRoot` mount; static fallback content must be a sibling, accurately mirror user-visible content, and be removed after React mounts. Do not hide crawler-only text or introduce cloaking.
- Every public HTML page uses the verified 1200×630 ClickPDF social preview for Open Graph and Twitter image tags unless a real page-specific image is supplied with verified dimensions and meaningful alt text.
- `artifacts/clickpdf/public/icon.svg` is the official gold shield, red PDF page, and lightning-bolt logo. Never redraw or substitute it. Generate favicon, Apple touch, and PWA raster icons from this asset; keep the static `<head>`, manifest, service-worker precache, Organization logo, and WebSite image references aligned to absolute production URLs.
- Every blog featured cover must use a generated WebP derivative with the official logo permanently composited at the bottom-right. Keep each source URL/file unchanged; `scripts/generate-blog-watermarks.mjs` owns derivative generation and the source-to-derivative map. Run it before Vite and sitemap generation; new Markdown blog covers are discovered automatically, while `--refresh` rebuilds existing derivatives.
- Validate canonical URLs, static HTML content, JSON-LD, sitemap, `robots.txt`, and `llms.txt` in the build tests. Keep heavy PDF engines code-split/lazy-loaded where possible, preserve existing layouts, and provide descriptive image `alt` text and control `aria-label`s.
- After a user explicitly requests production deployment, use `pnpm run deploy:clickpdf` from a clean Git worktree. It builds the monorepo, records the full source SHA and asset-manifest digest in the Cloudflare deployment message, uploads a manifest with a deterministic build ID and per-asset hashes, and verifies the active production version and every published asset. Do not deploy with raw Wrangler commands or deploy automatically on every code change.

## Product

- ClickPDF provides in-browser PDF editing, organization, conversion, inspection, OCR, and protection tools.

## User preferences

- Keep the separate Binance Futures scanner attachment out of the ClickPDF app.

## Gotchas

- ClickPDF was imported from an uploaded source ZIP; retain its existing features and branding when making integration changes.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
