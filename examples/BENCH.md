# Bench — tojiru

Measurements from 2026-06-26 (tojiru 0.4.0). Command: `tojiru <file> --out <folder>`.
Ratio = output bundle size / input file size.

## Results (5 formats + PDF counter-examples)

| Sample | Format | Pages | Input | Bundle | Ratio |
|---|---|---|---|---|---|
| Les non-humains (Ploum) | PDF vector text — Type1 | 9 | 203 KB | 187 KB | **×0.92** |
| Little Brother (Doctorow) | PDF vector text — TrueType | 134 | 1.9 MB | 7.9 MB | ×4.29 |
| Pepper&Carrot ep.1 | PDF (raster comic) | 4 | 164 KB | 440 KB | ×2.68 |
| NASA SP-4012 v2 | PDF scanned + OCR | 642 | 8.0 MB | 85 MB | ×10.8 |
| Pepper&Carrot ep.1 | CBZ | 4 | 1.0 MB | 1.1 MB | ×1.06 |
| Pepper&Carrot ep.1 | CB7 | 4 | 1.0 MB | 1.1 MB | ×1.06 |
| The Fanscient #03 | CBR | 32 | 6.5 MB | 7.1 MB | ×1.08 |
| Macaulay (essay) | DjVu | 163 | 2.6 MB | 15.0 MB | ×6.0 |

## Reading the numbers

**PDF vector text — where tojiru shines.** On "Les non-humains" (embedded Type1 fonts), the bundle is *smaller* than the source PDF (×0.92), with clean, infinitely scalable SVG text. On Little Brother (TrueType), it's ×4.29: still real vector, flawless rendering, but heavier. The difference comes from font encoding: for Type1, `pdftocairo` reuses each glyph via `<symbol>`/`<use>`; for TrueType, it emits one `<path>` per glyph occurrence. Rendering is identical, only the weight changes. Page coordinates are rounded to 2 decimals (0.01 pt), which trims ~25% off the SVG with no visible change — that is what pulled Little Brother down from ×5.6.

**Comic archives (CBZ/CB7/CBR) — bundle ≈ input.** Pages are already images: tojiru copies them and adds thumbnails. No bloat (×1.06 to ×1.08).

**Raster comic PDF — now routed to WebP.** When a PDF page is a full-page bitmap (no real vector text), tojiru no longer wraps it in SVG; it re-renders the page and stores a WebP. The Pepper&Carrot PDF dropped from ×33.9 (SVG-wrapped bitmap) to ×2.68. This is the right call for full-colour artwork shipped as a PDF.

**Scanned PDF — still the wrong fit.** NASA SP-4012 is a 642-page bitonal text scan with an OCR layer; the display is an image, so every page is raster. Its embedded scan images are bitonal (1 bit/pixel, very compact); re-rendering them as 150-DPI WebP lands at ×10.8 — slightly heavier than the naive SVG wrap (×10.1), because bitonal beats any general-purpose raster format. Either way it is ×10, far above the source: tojiru is built for vector text, not scans. For scanned books, keep the original PDF or a DjVu.

**DjVu ×6.0 — WebP lossless, after an instructive detour.** `ddjvu` renders each page as raster RGB. First attempt with WebP *lossy* (q82): ×29.4, worse than PNG (×15.8) **and** degraded. Macaulay is a bitonal text scan (1 bit/pixel); lossy WebP adds JPEG noise on text edges and bloats. The measured answer: **WebP lossless** (effort 6), which hits ~50% of PNG → ×6.0, with zero quality loss. The bundle is still larger than the source because DjVu's bitonal JB2 compression beats any general-purpose raster format; rasterizing has a cost. A photo-content DjVu would land much lower.

## Method

Real bench via the CLI on the `fetch-samples.sh` corpus. To reproduce:

```bash
bash examples/fetch-samples.sh
tojiru examples/samples/<file> --out /tmp/bench --force
du -sb /tmp/bench   # apparent bytes, comparable to the input file size
```
