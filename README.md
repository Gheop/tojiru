# tojiru

Turn a fixed-page document into a self-contained static web reader. Point it at a PDF, comic archive, or DjVu; get a folder you can drop on any static host or open locally. No server, no client-side PDF engine — pages are pre-rendered once and lazy-loaded.

`tojiru` (綴じる, "to bind a book") is the descendant of a PHP PDF reader written in 2009. The idea that kept it alive for 17 years: pre-render each page, ship it static, let the browser do nothing but display. This rewrite generalizes it to more formats and packages it as a CLI.

## What it does

```
tojiru book.pdf --out site/
# → site/  (index.html, reader.js, manifest.json, pages/, thumbs/)
# serve it, or open site/index.html
```

- **PDF** pages become crisp **vector SVG** (via poppler/mupdf). Text stays sharp at any zoom, and for born-digital PDFs the bundle is often *smaller* than the source.
- **Comics** (CBZ, CB7, CBR) and **DjVu** become image pages with thumbnails.
- The reader lazy-loads pages as you scroll (`IntersectionObserver`), has a thumbnail sidebar, keyboard navigation, reading-position memory (`localStorage`), and `#page=N` deep links.
- **Full-text search** (Ctrl+F) for PDFs with a text layer, a **table of contents** built from the PDF outline, a **dark theme** that follows the system, a phone-friendly layout, and an optional **double-page / right-to-left (manga)** view.
- SVG pages are gzipped and **inflated in the browser** (`DecompressionStream`), so they render correctly on any host regardless of its `Content-Encoding` configuration.

## Supported formats

| Format | How | Extra dependency |
|---|---|---|
| PDF | one SVG per page (vector) | `pdftocairo` (poppler) or `mutool` (mupdf) |
| CBZ | zip of images | none (bundled) |
| CB7 | 7-Zip archive of images | `7z` (p7zip) |
| CBR | RAR archive of images | none (bundled, WASM) |
| DjVu | rendered page by page | `ddjvu`, `djvused` (djvulibre) |

Comics work out of the box. Only PDF and DjVu need a system tool, detected at runtime — if it's missing, `tojiru` tells you which package to install instead of crashing.

Two PDF extras are picked up automatically when present: `pdftotext` (poppler, usually installed with `pdftocairo`) builds the search index, and `mutool` (mupdf) reads the outline for the table of contents. Both are optional — without them you just lose that one feature.

## Install

Requires **Node ≥ 20**.

```bash
npm install -g @gheop/tojiru
```

Or run it once without installing:

```bash
npx @gheop/tojiru book.pdf --out reader/
```

From source:

```bash
git clone <repo-url> tojiru
cd tojiru
npm install
npm run build
npm link        # makes the `tojiru` command available
```

Optional system tools (install only what you need):

```bash
# Debian/Ubuntu
sudo apt install poppler-utils djvulibre-bin p7zip-full mupdf-tools
# Fedora
sudo dnf install poppler-utils djvulibre p7zip mupdf
```

## Usage

```bash
tojiru <input> [options]
tojiru serve <dir> [options]
```

Generation shows per-page progress on stderr (e.g. `Converting 12/30`).

### Convert options

| Option | Description |
|---|---|
| `-o, --out <dir>` | Output folder (default: the input name without extension) |
| `-t, --title <title>` | Document title shown in the reader |
| `-f, --force` | Overwrite a non-empty output folder |
| `--serve` | Start a preview server on the output folder after converting |
| `--single-file [file]` | Output a single portable HTML file instead of a folder |
| `--image-format <fmt>` | Raster page encoding: `keep` (as-is, default) or `webp` |
| `--quality <n>` | WebP quality 1-100 for lossy raster pages (default: 80) |
| `--spread` | Lay pages out two-up (double-page spread) |
| `--rtl` | Right-to-left reading order (manga); pairs with `--spread` |
| `--paged` | Default to the paged view (one page per screen); the reader can switch back |

### Reading

The generated reader works the same whatever the source format:

- **Search** — Ctrl+F (or `/`) opens a text search for PDFs that shipped a text layer. Matches list the page with a highlighted excerpt; click one to jump there.
- **Table of contents** — when a PDF has an outline, it shows at the top of the thumbnail column; click an entry to jump to its page, and the current section is highlighted as you read.
- **Dark mode** — follows the system by default; the ◐ button toggles it and remembers your choice.
- **Paged view** — the ≣ / ▭ button switches between continuous scroll and one page per screen (horizontal, arrow-key or swipe navigation). `--paged` makes the paged view the default; the choice is remembered.
- **Double-page / manga** — `--spread` shows two pages per row; add `--rtl` for right-to-left order (page 1 on the right, left arrow advances).

```bash
tojiru manga.cbz --out manga/ --image-format webp --spread --rtl
```

### Single file

```bash
tojiru book.pdf --single-file book.html
```

Produces one `.html` file with all pages, thumbnails, and the reader bundled in. Double-click it to read offline — no server, no extra files. Works on any OS that has a browser.

Capped at 30 MB of page data. For large documents, use the folder output and host it.

### Smaller comics

```bash
tojiru comic.cbz --out comic/ --image-format webp
```

Comics keep their original images by default (`keep`), so the bundle matches the source.
Pass `--image-format webp` to re-encode raster pages as WebP — useful for colour comics
shipped as large PNGs. On the Pepper&Carrot sample this drops the bundle from 1.2 MB to
~300 KB with no visible loss. Pages already in WebP are left untouched.

`--quality <n>` sets the WebP quality (default 80). Lower it for maximum compression
(`--quality 75` is ~20% lighter again and still clean on most artwork); raise it for
archival (`--quality 92`). It applies to lossy raster pages — comics re-encoded with
`--image-format webp` and auto-rasterized scanned/comic PDFs. DjVu scans stay lossless.

### Preview server

```bash
tojiru serve out/         # serve an existing bundle
tojiru serve out/ -p 9000 # on a custom port
```

| Option | Description |
|---|---|
| `-p, --port <n>` | Port to listen on (default: 8000; auto-increments on EADDRINUSE) |

The server uses Node built-ins only — no extra dependencies. It opens the browser automatically (best-effort).

Examples:

```bash
tojiru novel.pdf --out reader/ --title "My Novel"
tojiru comic.cbz --out comic/
tojiru scan.djvu --out book/ --force

# preview immediately after converting
tojiru novel.pdf --out reader/ --serve

# or convert first, serve later
tojiru novel.pdf --out reader/
tojiru serve reader/
```

## Where it shines (and where it doesn't)

`tojiru` is built for **vector text**. Born-digital text PDFs render as compact, razor-sharp SVG. Scanned PDFs and image-heavy pages are rasterized, so the bundle grows — for those, the format is the wrong fit. Measured numbers are in [`examples/BENCH.md`](examples/BENCH.md), with a reproducible sample corpus in [`examples/`](examples/).

## How it works

```
input → detect format (magic bytes) → extractor → pages → manifest.json → static bundle + reader
```

Each format is a small plugin (`src/extractors/`) producing a normalized list of pages; everything downstream is format-agnostic. Adding a format means adding one extractor.

## Development

```bash
npm test            # unit + integration (vitest)
npm run test:e2e    # reader rendering (Playwright)
npm run dev -- <input> --out <dir>   # run the CLI from source via tsx
```

## License

MIT — see [LICENSE](LICENSE).

## Changelog

### v0.9.0 — Paged view, contents highlight, leaner comics (2026-06-26)

- **Paged reading view** — the ≣ / ▭ button switches the reader between continuous scroll and one page per screen (horizontal, arrow-key or swipe navigation), and the choice is remembered. `--paged` makes it the build default; `--rtl` pages it right-to-left.
- **The table of contents follows along** — the outline entry covering the current page is highlighted as you read.
- **`--image-format webp` never inflates a comic** — each page keeps WebP or its original, whichever is smaller. An already-compressed scan that used to grow ~2× now stays at its source size, while colour comics still drop to ~×0.3 (measured points in [`examples/BENCH.md`](examples/BENCH.md)).
- Tests run in CI on Node 24 (the Node 20 deprecation warning is gone), and a flaky reader e2e was de-flaked.

### v0.8.0 — Search, dark mode, contents and manga layout (2026-06-26)

- **Full-text search** (Ctrl+F or `/`) for PDFs that carry a text layer. `pdftotext` builds an index at conversion time (a `search.json` file, or inlined in single-file mode); matches list the page with a highlighted excerpt and jump there on click. Scans and comics keep the browser's native find.
- **Dark theme** that follows the system by default, with a ◐ button that toggles and remembers the choice. The reader now has a phone layout (the thumbnail column collapses to an overlay, full-width pages, larger tap targets), and the toolbar controls and thumbnails are real buttons reachable by keyboard.
- **Table of contents** built from the PDF outline via `mutool`, shown at the top of the thumbnail column; click an entry to jump to its page. Falls back to nothing when `mutool` or the outline is absent.
- **Double-page spread** (`--spread`) and **right-to-left manga order** (`--rtl`): two pages per row, page 1 on the right, the left arrow advances. Pairs wrap to one page per row on narrow screens.
- Tests now run in CI on GitHub and GitLab, and `--serve` opens a browser on Windows too.
- Internals: the single-file output is derived from `index.html` instead of duplicating the markup, and `buildManifest` takes an options object.

### v0.7.0 — Lighter vector text (2026-06-26)

- SVG page coordinates are now rounded to 1 decimal (0.1 pt) instead of 2 — measured ~19% lighter (gzipped) on glyph-heavy text PDFs, verified visually lossless even when zoomed (0.1 pt is ~0.13 px on screen).

### v0.6.0 — WebP quality control (2026-06-26)

- `--quality <n>` (default 80) sets the lossy WebP quality for comic and auto-rasterized PDF pages. The default dropped from 82 to 80 — measured ~8% smaller with no visible loss.
- Thumbnails are now encoded at WebP effort 6 (slightly smaller, free).
- DjVu stays lossless: benchmarking near-lossless against lossless on bitonal scans showed an identical size (no smooth content to quantize), so there was nothing to gain.

### v0.5.0 — WebP comics (2026-06-26)

- `--image-format webp` re-encodes raster (comic) pages to WebP — the Pepper&Carrot sample drops from 1.2 MB to 324 KB. Default stays `keep` (images copied as-is). Pages already in WebP are left untouched.
- Re-converting into an existing folder now clears the old `pages/` and `thumbs/` first, so a format switch never leaves orphaned page files behind.
- The repo's comic demo is now WebP, cutting the committed `site/demo` from 1.4 MB to ~550 KB.

### v0.4.0 — Single-file output (2026-06-26)

- `--single-file [file]` option: bundles all pages, thumbnails, and the reader into one portable HTML file
- Double-click the file to read offline — no server, no folder needed
- Size guard: rejects documents whose page data exceeds 30 MB and tells you to use folder output instead
- Folder mode and all existing tests unchanged

### v0.3.0 — Smaller PDF bundles (2026-06-26)

- Vector PDF page coordinates are rounded to 2 decimals — ~25% smaller pages, no visible change
- Image-only PDF pages (scans, comic PDFs) are auto-detected and rendered as WebP instead of SVG-wrapped bitmaps — e.g. a comic PDF dropped from ×34 to ×2.7

### v0.2.0 — Preview server and progress (2026-06-25)

- Built-in `tojiru serve <dir>` command previews a bundle locally — uses Node built-ins only, no extra install needed
- `--serve` flag on the convert command starts the server immediately after generating
- Per-page progress shown on stderr during generation (`Converting i/N`, `Processing i/N`)
- Browser opens automatically after `serve` / `--serve` (best-effort, swallows errors)

### v0.1.2 — Version reporting (2026-06-25)

- `tojiru --version` now reads the version from `package.json`, so it always matches the published version

### v0.1.1 — Scoped package name (2026-06-25)

- Published on npm as `@gheop/tojiru` (the unscoped `tojiru` name was taken); the installed command is still `tojiru`
- README install instructions corrected to the scoped name

### v0.1.0 — Initial release (2026-06-25)

- PDF → vector SVG pages; CBZ/CB7/CBR/DjVu → image pages
- Static folder bundle with a vanilla-JS lazy-loading reader (thumbnails, keyboard nav, resume, deep links)
- Format detection by content; graceful degradation when an optional system tool is missing
