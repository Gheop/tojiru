import { readFile, unlink, writeFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import type { Document, Extractor, Page, ProgressFn } from './types.js'
import { detectKind } from './detect.js'
import { findPdfConverter } from '../tools.js'
import { run } from '../run.js'
import { imageDims } from './images.js'

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0')
}

async function pageCount(file: string): Promise<number> {
  // pdfinfo is part of poppler; fall back to mutool if absent.
  try {
    const { stdout } = await run('pdfinfo', [file])
    const m = stdout.match(/^Pages:\s+(\d+)/m)
    if (m) return Number(m[1])
  } catch {
    /* try mutool below */
  }
  const { stdout } = await run('mutool', ['info', file])
  const m = stdout.match(/Pages:\s+(\d+)/)
  if (!m) throw new Error('Could not determine page count for PDF')
  return Number(m[1])
}

function viewBox(svg: string): { w: number; h: number } {
  const vb = svg.match(/viewBox="[\d.]+ [\d.]+ ([\d.]+) ([\d.]+)"/)
  if (vb) return { w: Math.round(Number(vb[1])), h: Math.round(Number(vb[2])) }
  const w = svg.match(/width="([\d.]+)/)
  const h = svg.match(/height="([\d.]+)/)
  if (w && h) return { w: Math.round(Number(w[1])), h: Math.round(Number(h[1])) }
  throw new Error('SVG has no usable dimensions')
}

// Rounds floats with ≥3 decimal places to `decimals` places.
// Integers and short floats (≤2 decimals) are unchanged.
// Safe for glyph outlines and <use> positions at 2 decimals (0.01 pt precision).
export function roundCoords(svg: string, decimals = 2): string {
  return svg.replace(/-?\d+\.\d{3,}/g, (m) => String(Number(parseFloat(m).toFixed(decimals))))
}

// A page is raster-dominated when pdftocairo wrapped a full-page bitmap in SVG:
// at least one <image> element and fewer than 50 <use> elements (vector glyphs).
function isRasterDominated(svg: string): boolean {
  const imageCount = (svg.match(/<image/g) ?? []).length
  const useCount = (svg.match(/<use/g) ?? []).length
  return imageCount >= 1 && useCount < 50
}

export const pdfExtractor: Extractor = {
  name: 'pdf',
  async canHandle(file) {
    return (await detectKind(file)) === 'pdf'
  },
  async extract(file, workdir, onProgress?: ProgressFn) {
    const conv = await findPdfConverter()
    if (!conv) {
      throw new Error('No PDF converter found. Install poppler (pdftocairo) or mupdf (mutool).')
    }
    const count = await pageCount(file)
    const width = Math.max(4, String(count).length)
    const pages: Page[] = []

    for (let i = 1; i <= count; i++) {
      const stem = pad(i, width)
      const svgPath = join(workdir, `${stem}.svg`)
      if (conv === 'pdftocairo') {
        await run('pdftocairo', ['-svg', '-f', String(i), '-l', String(i), file, svgPath])
      } else {
        await run('mutool', ['draw', '-F', 'svg', '-o', svgPath, file, String(i)])
      }
      const svg = await readFile(svgPath, 'utf8')

      if (conv === 'pdftocairo' && isRasterDominated(svg)) {
        // Full-page bitmap wrapped in SVG: re-render directly to PNG and drop the SVG.
        const pngStem = join(workdir, stem)
        await run('pdftocairo', ['-png', '-singlefile', '-r', '150', '-f', String(i), '-l', String(i), file, pngStem])
        const pngPath = `${pngStem}.png`
        await unlink(svgPath)
        pages.push({ type: 'raster', imagePath: pngPath, ...(await imageDims(pngPath)) })
      } else {
        // Vector page: round coordinates to shrink SVG, then store.
        const rounded = roundCoords(svg)
        await writeFile(svgPath, rounded, 'utf8')
        pages.push({ type: 'vector', svgPath, ...viewBox(rounded) })
      }

      onProgress?.(i, count, 'Converting')
    }

    return {
      title: basename(file, extname(file)),
      kind: 'pdf',
      pages,
    }
  },
}
