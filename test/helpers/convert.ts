import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pdfExtractor } from '../../src/extractors/pdf.js'
import { processPages } from '../../src/pages.js'
import { buildManifest } from '../../src/manifest.js'
import { writeFolder } from '../../src/output/folder.js'

export async function convertForTest(input: string, outDir: string): Promise<void> {
  const work = await mkdtemp(join(tmpdir(), 'tojiru-t-'))
  try {
    const doc = await pdfExtractor.extract(input, work)
    const pages = await processPages(doc, outDir)
    await writeFolder(buildManifest(doc.title, doc.kind, pages), outDir)
  } finally {
    await rm(work, { recursive: true, force: true })
  }
}
