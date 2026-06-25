import { readFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import type { Document, Extractor, VectorPage } from './types.js'
import { detectKind } from './detect.js'
import { findPdfConverter } from '../tools.js'
import { run } from '../run.js'

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

export const pdfExtractor: Extractor = {
  name: 'pdf',
  async canHandle(file) {
    return (await detectKind(file)) === 'pdf'
  },
  async extract(file, workdir) {
    const conv = await findPdfConverter()
    if (!conv) {
      throw new Error('No PDF converter found. Install poppler (pdftocairo) or mupdf (mutool).')
    }
    const count = await pageCount(file)
    const width = Math.max(4, String(count).length)
    const pages: VectorPage[] = []

    for (let i = 1; i <= count; i++) {
      const svgPath = join(workdir, `${pad(i, width)}.svg`)
      if (conv === 'pdftocairo') {
        await run('pdftocairo', ['-svg', '-f', String(i), '-l', String(i), file, svgPath])
      } else {
        await run('mutool', ['draw', '-F', 'svg', '-o', svgPath, file, String(i)])
      }
      const svg = await readFile(svgPath, 'utf8')
      pages.push({ type: 'vector', svgPath, ...viewBox(svg) })
    }

    return {
      title: basename(file, extname(file)),
      kind: 'pdf',
      pages,
    }
  },
}
