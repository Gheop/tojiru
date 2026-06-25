import { mkdir, readdir } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { createExtractorFromFile } from 'node-unrar-js'
import type { Document, Extractor, RasterPage } from './types.js'
import { detectKind } from './detect.js'
import { isImage, naturalCompare, imageDims } from './images.js'

export const cbrExtractor: Extractor = {
  name: 'cbr',
  async canHandle(file) { return (await detectKind(file)) === 'cbr' },
  async extract(file, workdir) {
    await mkdir(workdir, { recursive: true })
    // filenameTransform strips any directory component so that entries with
    // `../` or absolute paths cannot escape workdir (zip-slip defence).
    const extractor = await createExtractorFromFile({ filepath: file, targetPath: workdir, filenameTransform: (name) => basename(name) })
    // Consume the full iterator to trigger writes to disk.
    const { files } = extractor.extract()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _ of files) { /* iterate to trigger writes to targetPath */ }

    const found: string[] = []
    async function walk(d: string) {
      for (const e of await readdir(d, { withFileTypes: true })) {
        const p = join(d, e.name)
        if (e.isDirectory()) await walk(p)
        else if (isImage(e.name)) found.push(p)
      }
    }
    await walk(workdir)
    found.sort((a, b) => naturalCompare(basename(a), basename(b)))
    if (found.length === 0) throw new Error('No images found in the CBR')
    const pages: RasterPage[] = []
    for (const f of found) pages.push({ type: 'raster', imagePath: f, ...(await imageDims(f)) })
    return { title: basename(file, extname(file)), kind: 'cbr', pages }
  },
}
