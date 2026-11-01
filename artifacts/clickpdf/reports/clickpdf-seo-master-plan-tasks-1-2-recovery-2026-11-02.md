# ClickPDF — SEO Master Plan Tasks 1–2: Read-only inventory and technical crawl

**آڈٹ capture:** 2026-11-02 (Asia/Karachi) 00:49:35–00:59:20؛ تمام machine timestamps UTC میں ہیں۔  
**Production target:** `https://www.clickpdf.net/`  
**Source baseline:** branch `main`, HEAD `16d2533b1494937b2348b2a913cce69dcacafce1`؛ آغاز پر worktree صاف تھا، `origin/main` سے 126 commits آگے اور 0 پیچھے۔  
**آڈٹ کے اختتام پر:** وہی HEAD اور `main...origin/main [ahead 126]`؛ کوئی tracked source/config file تبدیل نہیں۔ صرف یہ دو audit reports نئی untracked files ہیں؛ `.local/tasks` evidence files `.gitignore` کے تحت ہیں۔  
**دائرہ:** صرف read-only SEO evidence؛ کوئی source، Worker، Cloudflare setting، DNS یا production تبدیلی نہیں ہوئی۔ کوئی build/deploy نہیں کیا گیا۔ پہلے Task 1 inventory file موجود نہیں تھی؛ یہ موجودہ local sitemap سے دوبارہ بنائی گئی ہے، پرانی فائل کی بازیافت کا دعویٰ نہیں۔

## خلاصۂ نتیجہ

- **P0/P1 تصدیق شدہ production failures:** کوئی نہیں۔ 767 sitemap URLs میں ہر ایک HTTP `200` ہوا؛ redirects، 4xx/5xx، access denial، challenge اور 429 نہیں ملے۔
- **P2 — source/live sitemap فرق:** repository کا current local sitemap 725 unique URLs اور 23 public tool IDs دکھاتا ہے؛ production sitemap 767 unique URLs اور 25 tool IDs دکھاتا ہے۔ 725 URLs exact مشترک ہیں، local-only صفر، production-only 42۔ فرق صرف `powerpoint-to-pdf` اور `repair-corrupted-pdf` کے 21-21 زبان/route URLs ہیں۔ یہ سب live میں HTTP `200` ہیں، مگر موجودہ source sitemap اور active public tool registry میں نہیں۔ یہ source/release consistency کا ثبوت ہے، خودبخود broken page نہیں؛ پہلے product decision درکار ہے کہ یہ tools مستقل public رہنے چاہئیں یا نہیں۔
- **P2 — raw crawl کی حد:** 32 tool pages (25 Japanese، 7 Chinese) پر کم raw text/3 scripts کی وجہ سے `possible_js_shell` heuristic آیا۔ HTTP `200`، title/H1/canonical موجود ہیں؛ browser rendering دستیاب نہ ہونے کے باعث visible client-rendered content کی تکمیل **غیرحتمی** ہے، missing-content defect ثابت نہیں۔
- **P2 — title localization flags:** 14 URLs میں 7 exact duplicate title pairs، مختلف locale paths میں ملے (چھ Spanish/Portuguese pairs، ایک French/Norwegian pair): `Dividir PDF`, `Comprimir PDF`, `Proteger PDF`, `Desbloquear PDF`, `Reparar PDF`, `Comparar PDF` (es/pt) اور `Signer PDF` (fr/no)۔ یہ انسانی/native-speaker review کے لیے فہرست ہے؛ کسی ترجمے کو reviewed قرار نہیں دیا گیا।
- **مثبت checks:** ہر page کا self-canonical موجود اور target HTTP `200`؛ 5,346 internal anchor edges کے ہر checked target کا status `200`؛ missing title/meta description/H1 صفر؛ HTML language بمقابلہ route locale mismatch صفر؛ missing image alt attribute صفر؛ JSON-LD parse errors صفر۔
- Production sitemap میں 756 localized pages کے ہر ایک کے 22 alternate references (21 language labels + `x-default`) HTML میں sitemap سے مکمل match، تمام targets `200` اور reciprocal؛ باقی 11 non-localized core routes پر alternate set نہیں، جو route inventory کے مطابق ہے۔
- Evidence SHA-256: local sitemap `7768085884593d9baca0035f59941379ce05988bd59e6a520a4ae672224b1726`; production sitemap `a960fd13f6ea5e37dea65daebdb6481a32c7553184fc0b02cead331ede9bfe7e`.

## 1. Robots, sitemap اور URL inventory

Production GET evidence:

| URL | Status / redirect | Server `Date` header (UTC) | Cache | Evidence |
|---|---:|---|---|---|
| `https://www.clickpdf.net/robots.txt` | 200 / کوئی redirect نہیں | 2026-11-01 19:45:44 | MISS | `.local/tasks/clickpdf-task174-source-evidence/production-robots-headers.txt` |
| `https://www.clickpdf.net/sitemap_index.xml` | 200 / کوئی redirect نہیں | 2026-11-01 19:45:44 | MISS | `.local/tasks/clickpdf-task174-source-evidence/production-sitemap-index-headers.txt` |
| `https://www.clickpdf.net/sitemap.xml` | 200 / کوئی redirect نہیں | 2026-11-01 19:46:18 | MISS | `.local/tasks/clickpdf-task174-source-evidence/production-sitemap-headers.txt` |

`robots.txt` میں `User-agent: *` کے لیے `Allow: /` ہے اور sitemap index live XML کی طرف جاتا ہے۔ Crawler نے robots policy **respect** کی؛ کوئی URL robots کی وجہ سے skip نہیں ہوا۔ اوپر کے times response `Date` headers ہیں، client-side request clock نہیں۔ Per-URL crawl کے timestamps `fetched_at_utc` میں درج ہیں۔

| ماخذ | URLs | tool route URLs | public tool IDs | blog/article routes | exact duplicates |
|---|---:|---:|---:|---:|---:|
| local `artifacts/clickpdf/public/sitemap.xml` | 725 | 483 (460 localized) | 23 | 231 post/article-related routes | 0 |
| production snapshot | 767 | 525 (500 localized) | 25 | 231 post/article-related routes | 0 |

دونوں sets میں ہر URL HTTPS، `www.clickpdf.net` اور non-root paths پر trailing slash کے ساتھ ہے؛ query strings/fragments یا slashless non-root URLs نہیں ملے۔ Scheme/host/trailing-slash کی وجہ سے کوئی mismatch نہیں۔ All URLs unique تھے۔ Local sitemap کے 725 URLs production میں بھی موجود ہیں۔

**32 raw-capture candidate URLs:** Japanese 25 اور Chinese 7 routes؛ ہر HTTP 200 ہوا، مگر raw HTML content completeness غیرحتمی رہی۔ مکمل URL اور وجہ `.local/tasks/clickpdf-task174-js-shell-candidates-2026-11-02.csv` میں ہے؛ یہ failed/untested URLs نہیں۔

**42 production-only URLs:**
- `/tools/powerpoint-to-pdf/` اور اس کے 20 localized prefixes (21 URLs کل)؛
- `/tools/repair-corrupted-pdf/` اور اس کے 20 localized prefixes (21 URLs کل)۔

ہر URL کی پوری فہرست `clickpdf-sitemap-diff-725-vs-767.csv` / `.json` میں ہے۔ دونوں route families کے تمام 42 live pages HTTP `200` ہیں۔ Audit نے انہیں حذف، شامل یا تبدیل نہیں کیا۔

## 2. مکمل production sitemap crawl

- BeyondSEO engine `2.9.1`، HTTP/raw HTML mode، production sitemap سے نکالے گئے **تمام 767 exact URLs** manually explicit `--only-url` targets کے طور پر دیے؛ sitemap rediscovery بند رکھا۔
- Crawl: `2026-11-01T19:49:35.969360+00:00` تا `2026-11-01T19:59:20.833691+00:00` UTC، تقریباً 584.9 seconds؛ workers 1، per-origin delay 0.75s، timeout 30s، 1 retry، response size cap 5MB؛ robots respected، recursive off-site crawl نہیں کیا۔ CLI options: `crawl https://www.clickpdf.net/ --out .local/tasks/clickpdf-task174-crawl-20261102 --max-pages 767 --selection breadth --workers 1 --delay 0.75 --timeout 30 --retries 1 --max-bytes 5000000 --max-discovered 10000 --include-www --no-sitemaps --mode http --robots respect`؛ 767 exact live sitemap URLs `--only-url` کے ساتھ الگ شامل تھے۔
- Exact desktop UA: `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36`؛ یہ Chrome-compatible desktop UA ہے، Googlebot کی شناخت بنا کر نہیں بھیجا گیا۔
- نتیجہ: 767/767 attempted اور inspected؛ 767×200، 0 redirect chain، 0 HTTP/transport failures، 0 blocked/challenge، 0 429، 0 untested۔ Robots.txt کا ایک اضافی HTTP fetch الگ ہے۔
- Crawled page URLs پر `CF-Ray`, `CF-Cache-Status`, `server`, content type, `X-Robots-Tag`, response/fetch time, redirects, attempts, response/request events اور response-body SHA-256 row-by-row محفوظ ہیں۔
- Browser/Playwright renderer دستیاب نہیں تھا؛ rendered capture صفر ہے۔ ابتدا میں global Python میں `bs4` missing تھا؛ skill dependencies صرف `/tmp/clickpdf-beyondseo-runtime` میں تیار کیں، repository میں نہیں۔ Playwright پھر بھی unavailable رہا۔

## 3. Technical SEO اور links

- HTTP extracted pages: 767/767؛ all titles, descriptions, H1, self canonicals موجود؛ title/description/H1 missing counts صفر۔ Title length 15–60 characters، description 19–158 characters؛ meta-description exact duplicates صفر۔ ہر page کا canonical final URL کے برابر ہے؛ target اسی crawl میں HTTP `200` ہے۔
- Meta `noindex`/Googlebot noindex اور non-empty `X-Robots-Tag` مشاہدہ نہیں ہوئے؛ HTTP-only indexability candidate سب 767 کے لیے true ہے۔ یہ **indexing کا ثبوت نہیں** اور Google-selected canonical، ranking یا index status معلوم نہیں کرتا۔
- 5,346 observed internal anchor edges؛ ہر edge کا target check status `200`، broken 0، unchecked 0۔ Raw HTML میں 666 unique internal destinations ملے۔ کوئی external HTTP(S) anchor destination نہیں ملا، اس لیے external URL fetch کی کوئی applicable entry نہیں۔ ایک `mailto:` link کو HTTP request نہیں کیا۔
- Raw `<img>` inspection میں 462 image elements ملے؛ missing `alt` attributes صفر اور empty `alt` صفر۔ JSON-LD parse errors صفر؛ یہ semantic/schema rich-result validation نہیں ہے۔
- 78 engine findings صرف دو اقسام: 32 `possible_js_shell` + 32 `capture_incomplete` (ایک ہی 32 pages پر؛ ایک مسئلے کو دو الگ page failures نہ گنیں)، اور 14 `duplicate_title` entries (7 locale pairs)۔ کوئی HTTP error finding نہیں۔

## 4. Language, canonical اور hreflang

- Production sitemap سے 21 language codes اخذ کیے: `en, ur, hi, ar, fr, de, zh, ja, tl, es, it, no, ru, pt, ko, tr, nl, pl, sv, id, vi`۔
- 767/767 `html lang` کا بنیادی language code sitemap/path language سے match ہوا۔
- 756 translated tool/article URLs × 22 expected alternates = 16,632 language/x-default destinations؛ HTML mapping sitemap سے مکمل match: missing/wrong/unexpected targets 0، target HTTP failures 0، reciprocity failures 0، missing `x-default` 0۔ ہر locale family میں 21 language labels اور ایک `x-default` ہے۔
- باقی 11 URLs homepage, tools index, blog index, FAQ, batch اور 6 legal routes ہیں؛ ان کے sitemap میں alternate sets نہیں ہیں۔
- Native-speaker review، translation meaning/quality یا rendered locale display اس HTTP audit میں verify نہیں کیا گیا۔

## 5. Source review، priorities اور اگلے فیصلے

دیکھی گئی source/config files: `artifacts/clickpdf/public/robots.txt`, `public/sitemap.xml`, `scripts/generate-blog-sitemap.mjs`, `src/i18n/translations.ts`, `src/data/toolsData.ts`, `src/data/toolSeoData.ts`, `static-tool-registry.mjs`, `src/utils/routeParser.ts`, `cloudflare-worker.mjs`۔ Active local registry 23 public tools کی ہے؛ production sitemap میں دو مزید IDs کے routes ہیں۔ کوئی Cloudflare dashboard/API، DNS، Worker setting، deployment record یا production setting تبدیل نہیں کی گئی۔

**Priority breakdown:**
- **P0:** کوئی نہیں۔
- **P1:** کوئی confirmed live outage, broken internal target, noindex, canonical/hreflang failure یا robots denial نہیں۔
- **P2:** 42 live-only tool sitemap routes کی source/registry ownership کی تصدیق؛ 32 Japanese/Chinese pages کی rendered capture availability؛ 7 duplicate locale title pairs کی human linguistic review۔ یہ تینوں مشاہدات ہیں، خودکار repair یا translation approval نہیں۔
- **P3:** اس crawl سے کوئی الگ confirmed minor technical failure نہیں۔

**حدود:** Search rankings/traffic/conversions، complete inbound backlinks، actual Google indexing/Google-selected canonical، Core Web Vitals، structured data semantic validity اور browser-rendered page completeness نہیں ناپی گئی۔ یہ 767 sitemap entries کی مکمل coverage ہے؛ اسے مکمل web-wide discovery claim نہ سمجھیں—sitemap سے باہر orphan URLs اس scope میں شامل نہیں۔

## 6. Evidence files

- Inventory: `.local/tasks/clickpdf-verified-url-inventory.csv` / `.json` (725 local + 767 production observations)۔
- Sitemap set diff: `.local/tasks/clickpdf-sitemap-diff-725-vs-767.csv` / `.json`۔
- Per-URL crawl: `.local/tasks/clickpdf-task174-crawl-20261102.csv` / `.json` (ہر 767 URL، headers/IDs/fetch data، redirects، SEO/link/hreflang results)۔
- Hreflang matrix: `.local/tasks/clickpdf-localization-hreflang-audit-2026-11-02.csv` / `.json`۔
- 32 rendered-content candidates: `.local/tasks/clickpdf-task174-js-shell-candidates-2026-11-02.csv`؛ 7 duplicate-title pairs: `.local/tasks/clickpdf-task174-duplicate-title-pairs-2026-11-02.csv`۔
- Untested sitemap URL list: `.local/tasks/clickpdf-task174-untested-sitemap-urls-2026-11-02.csv` (صرف header، کوئی URL باقی نہیں)۔
- External link check: `.local/tasks/clickpdf-task174-external-link-checks-2026-11-02.json` (0 external HTTP(S) anchor destinations)۔
- External link result: `.local/tasks/clickpdf-task174-external-link-checks-2026-11-02.json`۔
- Raw BeyondSEO output (pages, links, issues, access, robots, raw HTML, hashes): `.local/tasks/clickpdf-task174-crawl-20261102/`۔
- Production sitemap snapshots and response headers: `.local/tasks/clickpdf-task174-source-evidence/`۔

**نتیجہ:** Audit مکمل ہے، مگر follow-up implementation سے پہلے 42 production-only tool routes کے بارے میں مالک کا فیصلہ اور 32 pages کے لیے browser render evidence سب سے اہم ہیں۔

**Production changes: NONE. Deployment: NOT AUTHORIZED. Application code changes: NOT AUTHORIZED.**
