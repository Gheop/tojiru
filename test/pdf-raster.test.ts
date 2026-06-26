import { test, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { makeImagePdf } from './helpers/fixtures.js'
import { pdfExtractor } from '../src/extractors/pdf.js'
import { findPdfConverter } from '../src/tools.js'

let dir: string
beforeAll(() => { dir = mkdtempSync(join(tmpdir(), 'tojiru-pdf-raster-')) })
afterAll(() => { rmSync(dir, { recursive: true, force: true }) })

test('image-dominated PDF pages are emitted as raster with .webp paths and positive dims', async (ctx) => {
  if (!(await findPdfConverter())) ctx.skip()
  const pdf = join(dir, 'scanned.pdf')
  await makeImagePdf(pdf, 2)
  const work = mkdtempSync(join(tmpdir(), 'tojiru-work-'))
  try {
    const doc = await pdfExtractor.extract(pdf, work)
    expect(doc.kind).toBe('pdf')
    expect(doc.pages).toHaveLength(2)
    for (const page of doc.pages) {
      expect(page.type).toBe('raster')
      if (page.type === 'raster') {
        expect(page.imagePath).toMatch(/\.webp$/)
        expect(page.w).toBeGreaterThan(0)
        expect(page.h).toBeGreaterThan(0)
      }
    }
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
})
