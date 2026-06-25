import { mkdir } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import sharp from 'sharp'
import type { Document, Extractor, RasterPage } from './types.js'
import { detectKind } from './detect.js'
import { hasBinary } from '../tools.js'
import { run } from '../run.js'
import { imageDims } from './images.js'

async function pageCount(file: string): Promise<number> {
  const { stdout } = await run('djvused', ['-e', 'n', file])
  const n = parseInt(stdout.trim(), 10)
  if (!Number.isFinite(n) || n < 1) throw new Error('Nombre de pages DjVu illisible')
  return n
}

export const djvuExtractor: Extractor = {
  name: 'djvu',
  async canHandle(file) { return (await detectKind(file)) === 'djvu' },
  async extract(file, workdir) {
    if (!(await hasBinary('ddjvu')) || !(await hasBinary('djvused'))) {
      throw new Error('djvulibre introuvable. Installe djvulibre (ddjvu, djvused).')
    }
    await mkdir(workdir, { recursive: true })
    const count = await pageCount(file)
    const width = Math.max(4, String(count).length)
    const pages: RasterPage[] = []
    for (let i = 1; i <= count; i++) {
      const stem = String(i).padStart(width, '0')
      const tiff = join(workdir, `${stem}.tiff`)
      const webp = join(workdir, `${stem}.webp`)
      await run('ddjvu', ['-format=tiff', `-page=${i}`, file, tiff])
      await sharp(tiff).webp({ quality: 85 }).toFile(webp)
      pages.push({ type: 'raster', imagePath: webp, ...(await imageDims(webp)) })
    }
    return { title: basename(file, extname(file)), kind: 'djvu', pages }
  },
}
