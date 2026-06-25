import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { processPages } from '../../src/pages.js'
import { buildManifest } from '../../src/manifest.js'
import { writeFolder } from '../../src/output/folder.js'
import type { Document } from '../../src/extractors/types.js'

function svg(label: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"><rect width="200" height="300" fill="#fff"/><text x="20" y="60" font-size="24">${label}</text></svg>`
}

export async function makeBundle(outDir: string): Promise<void> {
  const work = await mkdtemp(join(tmpdir(), 'tojiru-e2e-'))
  try {
    const a = join(work, 'a.svg')
    const b = join(work, 'b.svg')
    await writeFile(a, svg('Page 1'))
    await writeFile(b, svg('Page 2'))
    const doc: Document = {
      title: 'Demo',
      kind: 'pdf',
      pages: [
        { type: 'vector', svgPath: a, w: 200, h: 300 },
        { type: 'vector', svgPath: b, w: 200, h: 300 },
      ],
    }
    const pages = await processPages(doc, outDir)
    await writeFolder(buildManifest(doc.title, doc.kind, pages), outDir)
  } finally {
    await rm(work, { recursive: true, force: true })
  }
}

// Permet de générer le bundle en ligne de commande avant Playwright.
// La garde import.meta.url empêche l'exécution lors d'un import par globalSetup.
const isMain = process.argv[1]?.endsWith('make-bundle.ts') || process.argv[1]?.endsWith('make-bundle.js')
if (isMain && process.argv[2]) {
  makeBundle(process.argv[2]).then(() => console.log('bundle prêt'))
}
