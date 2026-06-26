import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { processPages } from '../../src/pages.js'
import { buildManifest } from '../../src/manifest.js'
import { writeFolder } from '../../src/output/folder.js'
import { writeSingleFile } from '../../src/output/single-file.js'
import type { Document } from '../../src/extractors/types.js'

function svg(label: string): string {
  // Both pages define <g id="ink"> with different text and reference it via <use>.
  // With inline SVG injection, both pages share the same DOM so the second page's
  // <use xlink:href="#ink"> resolves to page 1's <g id="ink"> (garbled text).
  // With <object> isolation each page is its own document, so #ink resolves locally.
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 200 300">
  <rect width="200" height="300" fill="#fff"/>
  <defs><g id="ink"><text x="20" y="50" font-size="24">${label}</text></g></defs>
  <use xlink:href="#ink"/>
</svg>`
}

async function demoDoc(work: string): Promise<Document> {
  const a = join(work, 'a.svg')
  const b = join(work, 'b.svg')
  await writeFile(a, svg('Page 1'))
  await writeFile(b, svg('Page 2'))
  return {
    title: 'Demo',
    kind: 'pdf',
    pages: [
      { type: 'vector', svgPath: a, w: 200, h: 300 },
      { type: 'vector', svgPath: b, w: 200, h: 300 },
    ],
  }
}

export async function makeBundle(outDir: string): Promise<void> {
  const work = await mkdtemp(join(tmpdir(), 'tojiru-e2e-'))
  try {
    const doc = await demoDoc(work)
    const pages = await processPages(doc, outDir)
    await writeFolder(buildManifest(doc.title, doc.kind, pages), outDir)
  } finally {
    await rm(work, { recursive: true, force: true })
  }
}

// Builds a single-file HTML (the double-click / file:// output) into outFile.
export async function makeSingleFile(outFile: string): Promise<void> {
  const work = await mkdtemp(join(tmpdir(), 'tojiru-e2e-sf-'))
  const bundle = await mkdtemp(join(tmpdir(), 'tojiru-e2e-sfb-'))
  try {
    const doc = await demoDoc(work)
    const pages = await processPages(doc, bundle)
    const manifest = buildManifest(doc.title, doc.kind, pages)
    await writeFolder(manifest, bundle)
    await writeSingleFile(manifest, bundle, outFile)
  } finally {
    await rm(work, { recursive: true, force: true })
    await rm(bundle, { recursive: true, force: true })
  }
}

// Allows generating the bundle from the command line before Playwright.
// The import.meta.url guard prevents execution when imported by globalSetup.
const isMain = process.argv[1]?.endsWith('make-bundle.ts') || process.argv[1]?.endsWith('make-bundle.js')
if (isMain && process.argv[2]) {
  makeBundle(process.argv[2]).then(() => console.log('bundle ready'))
}
