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

## Product

- ClickPDF provides in-browser PDF editing, organization, conversion, inspection, OCR, and protection tools.

## User preferences

- Keep the separate Binance Futures scanner attachment out of the ClickPDF app.

## Gotchas

- ClickPDF was imported from an uploaded source ZIP; retain its existing features and branding when making integration changes.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
