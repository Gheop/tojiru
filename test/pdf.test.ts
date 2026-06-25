import { test, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { makePdf } from './helpers/fixtures.js'
import { pdfExtractor, roundCoords } from '../src/extractors/pdf.js'
import { findPdfConverter } from '../src/tools.js'

test('roundCoords rounds floats with ≥3 decimals, leaves integers and short floats untouched', () => {
  const input = '<svg x="1.23456" y="10" z="3.14"/>'
  const out = roundCoords(input)
  expect(out).toBe('<svg x="1.23" y="10" z="3.14"/>')
})

let dir: string
beforeAll(() => { dir = mkdtempSync(join(tmpdir(), 'tojiru-pdf-')) })
afterAll(() => { rmSync(dir, { recursive: true, force: true }) })

test('extracts a vector Document with one page per PDF page', async (ctx) => {
  if (!(await findPdfConverter())) ctx.skip()
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
