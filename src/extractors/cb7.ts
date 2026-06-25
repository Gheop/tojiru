import { mkdir, readdir } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import type { Document, Extractor, RasterPage } from './types.js'
import { detectKind } from './detect.js'
import { hasBinary } from '../tools.js'
import { run } from '../run.js'
import { isImage, naturalCompare, imageDims } from './images.js'

export const cb7Extractor: Extractor = {
  name: 'cb7',
  async canHandle(file) { return (await detectKind(file)) === 'cb7' },
  async extract(file, workdir) {
    if (!(await hasBinary('7z'))) throw new Error('7z not found. Install p7zip (package p7zip / p7zip-full).')
    await mkdir(workdir, { recursive: true })
    // -y : oui à tout ; e : extraire sans arborescence ; -o : dossier de sortie
    await run('7z', ['e', '-y', `-o${workdir}`, file])
    const files = (await readdir(workdir)).filter(isImage).sort(naturalCompare).map((n) => join(workdir, n))
    if (files.length === 0) throw new Error('No images found in the CB7')
    const pages: RasterPage[] = []
    for (const f of files) pages.push({ type: 'raster', imagePath: f, ...(await imageDims(f)) })
    return { title: basename(file, extname(file)), kind: 'cb7', pages }
  },
}
