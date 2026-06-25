import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { detectKind } from './extractors/detect.js'
import { pdfExtractor } from './extractors/pdf.js'
import { cbzExtractor } from './extractors/cbz.js'
import { cb7Extractor } from './extractors/cb7.js'
import { cbrExtractor } from './extractors/cbr.js'
import { processPages } from './pages.js'
import { buildManifest } from './manifest.js'
import { writeFolder } from './output/folder.js'
import type { Extractor } from './extractors/types.js'

const EXTRACTORS: Extractor[] = [pdfExtractor, cbzExtractor, cb7Extractor, cbrExtractor]

export interface ConvertOptions {
  outDir: string
  title?: string
}

export interface ConvertResult {
  outDir: string
  pageCount: number
}

export async function convert(input: string, opts: ConvertOptions): Promise<ConvertResult> {
  const kind = await detectKind(input)
  const extractor = EXTRACTORS.find((e) => e.name === kind)
  if (!extractor) {
    throw new Error(kind ? `Format pas encore supporté : ${kind}` : 'Format non reconnu')
  }

  const work = await mkdtemp(join(tmpdir(), 'tojiru-'))
  try {
    const doc = await extractor.extract(input, work)
    if (opts.title) doc.title = opts.title
    if (doc.pages.length === 0) throw new Error('Aucune page extraite.')
    const pages = await processPages(doc, opts.outDir)
    await writeFolder(buildManifest(doc.title, doc.kind, pages), opts.outDir)
    return { outDir: opts.outDir, pageCount: doc.pages.length }
  } finally {
    await rm(work, { recursive: true, force: true })
  }
}
