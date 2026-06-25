import { test, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { makePdf } from './helpers/fixtures.js'
import { pdfExtractor } from '../src/extractors/pdf.js'
import { findPdfConverter } from '../src/tools.js'

let dir: string
beforeAll(() => { dir = mkdtempSync(join(tmpdir(), 'tojiru-pdf-')) })
afterAll(() => { rmSync(dir, { recursive: true, force: true }) })

test('extrait un Document vector avec une page par page du PDF', async () => {
  if (!(await findPdfConverter())) {
    console.warn('Aucun convertisseur PDF, test sauté')
    return
  }
  const pdf = join(dir, 'deux.pdf')
  await makePdf(pdf, 2)
  const work = mkdtempSync(join(tmpdir(), 'tojiru-work-'))
  const doc = await pdfExtractor.extract(pdf, work)

  expect(doc.kind).toBe('pdf')
  expect(doc.pages).toHaveLength(2)
  expect(doc.pages[0].type).toBe('vector')
  expect(doc.pages[0].w).toBeGreaterThan(0)
  expect(doc.pages[0].h).toBeGreaterThan(0)
  rmSync(work, { recursive: true, force: true })
})
