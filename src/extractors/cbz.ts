import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import yauzl from 'yauzl'
import type { Document, Extractor, RasterPage } from './types.js'
import { detectKind } from './detect.js'
import { isImage, naturalCompare, imageDims } from './images.js'

function openZip(file: string): Promise<yauzl.ZipFile> {
  return new Promise((resolve, reject) => {
    yauzl.open(file, { lazyEntries: true, decodeStrings: false }, (err, zip) => (err ? reject(err) : resolve(zip)))
  })
}

// Extrait toutes les entrées image vers workdir (noms aplatis), renvoie les chemins.
function extractAll(zip: yauzl.ZipFile, workdir: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const out: string[] = []
    zip.on('entry', (entry: yauzl.Entry) => {
      const name = (entry.fileName as unknown as Buffer).toString('utf8')
      if (name.endsWith('/') || !isImage(name)) { zip.readEntry(); return }
      zip.openReadStream(entry, async (err, rs) => {
        if (err) return reject(err)
        const dest = join(workdir, basename(name))
        try { await pipeline(rs, createWriteStream(dest)); out.push(dest); zip.readEntry() }
        catch (e) { reject(e) }
      })
    })
    zip.on('end', () => resolve(out))
    zip.on('error', reject)
    zip.readEntry()
  })
}

export const cbzExtractor: Extractor = {
  name: 'cbz',
  async canHandle(file) { return (await detectKind(file)) === 'cbz' },
  async extract(file, workdir) {
    await mkdir(workdir, { recursive: true })
    const zip = await openZip(file)
    const files = (await extractAll(zip, workdir)).sort((a, b) => naturalCompare(basename(a), basename(b)))
    if (files.length === 0) throw new Error('No images found in the CBZ')
    const pages: RasterPage[] = []
    for (const f of files) pages.push({ type: 'raster', imagePath: f, ...(await imageDims(f)) })
    return { title: basename(file, extname(file)), kind: 'cbz', pages }
  },
}
