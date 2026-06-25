import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { basename, join } from 'node:path'
import sharp from 'sharp'
import type { Document } from './extractors/types.js'

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
  opts: { thumbWidth?: number } = {},
): Promise<ProcessedPage[]> {
  const thumbWidth = opts.thumbWidth ?? 150
  const width = Math.max(4, String(doc.pages.length).length)
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
      const ext = basename(page.imagePath).split('.').pop() ?? 'jpg'
      const file = `pages/${stem}.${ext}`
      await copyFile(page.imagePath, join(outDir, file))
      await sharp(page.imagePath).resize({ width: thumbWidth }).webp().toFile(join(outDir, thumb))
      out.push({ n, type: 'raster', w: page.w, h: page.h, file, thumb })
    }
  }
  return out
}
