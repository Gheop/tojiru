import { mkdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { basename, join } from 'node:path'
import sharp from 'sharp'
import type { Document, ProgressFn } from './extractors/types.js'

export interface ProcessedPage {
  n: number
  type: 'vector' | 'raster'
  w: number
  h: number
  file: string
  thumb: string
}

export async function processPages(
  doc: Document,
  outDir: string,
  opts: { thumbWidth?: number; imageFormat?: 'keep' | 'webp' } = {},
  onProgress?: ProgressFn,
): Promise<ProcessedPage[]> {
  const thumbWidth = opts.thumbWidth ?? 150
  const imageFormat = opts.imageFormat ?? 'keep'
  const width = Math.max(4, String(doc.pages.length).length)
  // Clear pages/ and thumbs/ first so a re-convert (e.g. --force into a previous run,
  // or a format switch) never leaves orphaned page files behind. These two dirs are
  // owned entirely by tojiru, so removing them does not touch user content.
  await rm(join(outDir, 'pages'), { recursive: true, force: true })
  await rm(join(outDir, 'thumbs'), { recursive: true, force: true })
  await mkdir(join(outDir, 'pages'), { recursive: true })
  await mkdir(join(outDir, 'thumbs'), { recursive: true })

  const out: ProcessedPage[] = []
  for (let i = 0; i < doc.pages.length; i++) {
    const page = doc.pages[i]
    const n = i + 1
    const stem = String(n).padStart(width, '0')
    const thumb = `thumbs/${stem}.webp`

    if (page.type === 'vector') {
      const svg = await readFile(page.svgPath)
      const file = `pages/${stem}.svgz`
      await writeFile(join(outDir, file), gzipSync(svg, { level: 9 }))
      await sharp(svg, { density: 96 }).resize({ width: thumbWidth }).webp().toFile(join(outDir, thumb))
      out.push({ n, type: 'vector', w: page.w, h: page.h, file, thumb })
    } else {
      const ext = (basename(page.imagePath).split('.').pop() ?? 'jpg').toLowerCase()
      // --image-format webp re-encodes comic pages (often large lossless PNGs) to
      // lossy WebP. Sources already in WebP are copied — re-encoding would only degrade.
      let file: string
      if (imageFormat === 'webp' && ext !== 'webp') {
        file = `pages/${stem}.webp`
        await sharp(page.imagePath).webp({ quality: 82, effort: 6 }).toFile(join(outDir, file))
      } else {
        file = `pages/${stem}.${ext}`
        await copyFile(page.imagePath, join(outDir, file))
      }
      await sharp(page.imagePath).resize({ width: thumbWidth }).webp().toFile(join(outDir, thumb))
      out.push({ n, type: 'raster', w: page.w, h: page.h, file, thumb })
    }
    onProgress?.(i + 1, doc.pages.length, 'Processing')
  }
  return out
}
