# Bench — tojiru

Measurements from 2026-06-25. Command: `tojiru <file> --out <folder>`.
Ratio = output bundle size / input file size.

## Results (5 formats + PDF counter-examples)

| Sample | Format | Pages | Input | Bundle | Ratio |
|---|---|---|---|---|---|
| Les non-humains (Ploum) | PDF vector text — Type1 | 9 | 202 KB | 186 KB | **×0.92** |
| Little Brother (Doctorow) | PDF vector text — TrueType | 134 | 1.9 MB | 10.5 MB | ×5.6 |
| Pepper&Carrot ep.1 | PDF (raster comic) | 4 | 163 KB | 5.5 MB | ×33.9 |
| NASA SP-4012 v2 | PDF scanned + OCR | 642 | 8.0 MB | 80.7 MB | ×10.1 |
| Pepper&Carrot ep.1 | CBZ | 4 | 1.0 MB | 1.1 MB | ×1.06 |
| Pepper&Carrot ep.1 | CB7 | 4 | 1.0 MB | 1.1 MB | ×1.06 |
| The Fanscient #03 | CBR | 32 | 6.5 MB | 7.1 MB | ×1.08 |
| Macaulay (essay) | DjVu | 163 | 2.6 MB | 15.0 MB | ×6.0 |

## Reading the numbers

**PDF vector text — where tojiru shines.** On "Les non-humains" (embedded Type1 fonts), the bundle is *smaller* than the source PDF (×0.92), with clean, infinitely scalable SVG text. On Little Brother (TrueType), it's ×5.6: still real vector, flawless rendering, but heavier. The difference comes from font encoding: for Type1, `pdftocairo` reuses each glyph via `<symbol>`/`<use>`; for TrueType, it emits one `<path>` per glyph occurrence. Rendering is identical, only the weight changes.

**Comic archives (CBZ/CB7/CBR) — bundle ≈ input.** Pages are already images: tojiru copies them and adds thumbnails. No bloat (×1.06 to ×1.08).

**Raster or scanned PDF — the limit.** When PDF pages are images (raster comic ×33.9; NASA scan ×10.1), `pdftocairo` wraps each image in SVG, which weighs more than the original image. NASA SP-4012 illustrates the trap: it has an OCR layer (extractable text) but the display is a scan, so it is treated as raster. tojiru is not designed for scanned content; it is designed for vector text.

**DjVu ×6.0 — WebP lossless, after an instructive detour.** `ddjvu` renders each page as raster RGB. First attempt with WebP *lossy* (q82): ×29.4, worse than PNG (×15.8) **and** degraded. Macaulay is a bitonal text scan (1 bit/pixel); lossy WebP adds JPEG noise on text edges and bloats. The measured answer: **WebP lossless** (effort 6), which hits ~50% of PNG → ×6.0, with zero quality loss. The bundle is still larger than the source because DjVu's bitonal JB2 compression beats any general-purpose raster format; rasterizing has a cost. A photo-content DjVu would land much lower.

## Method

Real bench via the CLI on the `fetch-samples.sh` corpus. To reproduce:

```bash
bash examples/fetch-samples.sh
tojiru examples/samples/<file> --out /tmp/bench --force
du -sh /tmp/bench
```
