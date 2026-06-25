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

## Install

Requires **Node ≥ 20**.

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
sudo apt install poppler-utils djvulibre-bin p7zip-full
# Fedora
sudo dnf install poppler-utils djvulibre p7zip
```

## Usage

```bash
tojiru <input> [options]
```

| Option | Description |
|---|---|
| `-o, --out <dir>` | Output folder (default: the input name without extension) |
| `-t, --title <title>` | Document title shown in the reader |
| `-f, --force` | Overwrite a non-empty output folder |

Examples:

```bash
tojiru novel.pdf --out reader/ --title "My Novel"
tojiru comic.cbz --out comic/
tojiru scan.djvu --out book/ --force
```

Then serve the folder with any static server (`npx http-server reader/`) or open `index.html`.

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

### v0.1.0 — Initial release (2026-06-25)

- PDF → vector SVG pages; CBZ/CB7/CBR/DjVu → image pages
- Static folder bundle with a vanilla-JS lazy-loading reader (thumbnails, keyboard nav, resume, deep links)
- Format detection by content; graceful degradation when an optional system tool is missing
