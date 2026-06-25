import { test, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { makeDjvu } from './helpers/djvu.js'
import { djvuExtractor } from '../src/extractors/djvu.js'
import { hasBinary } from '../src/tools.js'

let dir: string
beforeAll(() => { dir = mkdtempSync(join(tmpdir(), 'tojiru-djvu-')) })
afterAll(() => { rmSync(dir, { recursive: true, force: true }) })

test('extracts a DjVu into browser-displayable raster pages', async (ctx) => {
  if (!(await hasBinary('ddjvu')) || !(await hasBinary('c44'))) ctx.skip()
  const dj = join(dir, 'book.djvu')
  await makeDjvu(dj, 2)
  const work = mkdtempSync(join(tmpdir(), 'tojiru-djvuwork-'))
  const doc = await djvuExtractor.extract(dj, work)
  expect(doc.kind).toBe('djvu')
  expect(doc.pages).toHaveLength(2)
  expect(doc.pages[0].type).toBe('raster')
  expect(doc.pages[0].imagePath).toMatch(/\.webp$/)  // browser-displayable format
  expect(doc.pages[0].w).toBeGreaterThan(0)
  rmSync(work, { recursive: true, force: true })
})
