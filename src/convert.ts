import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { detectKind } from './extractors/detect.js'
import { pdfExtractor } from './extractors/pdf.js'
import { cbzExtractor } from './extractors/cbz.js'
import { cb7Extractor } from './extractors/cb7.js'
import { cbrExtractor } from './extractors/cbr.js'
import { djvuExtractor } from './extractors/djvu.js'
import { processPages } from './pages.js'
import { buildManifest } from './manifest.js'
import { buildSearchIndex } from './search.js'
import { writeFolder } from './output/folder.js'
import { writeSingleFile } from './output/single-file.js'
import type { Extractor, ProgressFn } from './extractors/types.js'

const EXTRACTORS: Extractor[] = [pdfExtractor, cbzExtractor, cb7Extractor, cbrExtractor, djvuExtractor]

export interface ConvertOptions {
  outDir: string
  title?: string
  onProgress?: ProgressFn
  singleFile?: string
  imageFormat?: 'keep' | 'webp'
  quality?: number
  spread?: boolean
  rtl?: boolean
}

export interface ConvertResult {
  outDir: string
  pageCount: number
}

export async function convert(input: string, opts: ConvertOptions): Promise<ConvertResult> {
  const kind = await detectKind(input)
  const extractor = EXTRACTORS.find((e) => e.name === kind)
  if (!extractor) {
    throw new Error(kind ? `Format not yet supported: ${kind}` : 'Unrecognised format')
  }

  const work = await mkdtemp(join(tmpdir(), 'tojiru-'))
  // In single-file mode, pages are staged in a temporary bundle dir that gets
  // cleaned up after the HTML is written. In folder mode, outDir is the final output.
  const bundleDir = opts.singleFile
    ? await mkdtemp(join(tmpdir(), 'tojiru-bundle-'))
    : opts.outDir

  try {
    const doc = await extractor.extract(input, work, opts.onProgress, { quality: opts.quality })
    if (opts.title) doc.title = opts.title
    if (doc.pages.length === 0) throw new Error('No pages extracted.')
    const pages = await processPages(doc, bundleDir, { imageFormat: opts.imageFormat, quality: opts.quality }, opts.onProgress)
    const search = buildSearchIndex(doc)
    const manifest = buildManifest(doc.title, doc.kind, pages, {
      searchable: search.length > 0,
      outline: doc.outline,
      spread: opts.spread,
      rtl: opts.rtl,
    })
    if (opts.singleFile) {
      await writeSingleFile(manifest, bundleDir, opts.singleFile, search)
      return { outDir: opts.singleFile, pageCount: doc.pages.length }
    }
    await writeFolder(manifest, bundleDir, search)
    return { outDir: opts.outDir, pageCount: doc.pages.length }
  } finally {
    await rm(work, { recursive: true, force: true })
    if (opts.singleFile) {
      await rm(bundleDir, { recursive: true, force: true })
    }
  }
}
