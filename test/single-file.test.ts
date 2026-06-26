import { test, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync, existsSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { makePdf } from './helpers/fixtures.js'
import { convert } from '../src/convert.js'
import { findPdfConverter } from '../src/tools.js'

let dir: string
beforeAll(() => { dir = mkdtempSync(join(tmpdir(), 'tojiru-sf-')) })
afterAll(() => { rmSync(dir, { recursive: true, force: true }) })

test('produces a single self-contained HTML file', async (ctx) => {
  if (!(await findPdfConverter())) ctx.skip()

  const pdf = join(dir, 'book.pdf')
  await makePdf(pdf, 3)

  const outHtml = join(dir, 'book.html')
  const r = await convert(pdf, { outDir: '', singleFile: outHtml })

  expect(r.pageCount).toBe(3)
  expect(existsSync(outHtml)).toBe(true)

  const html = await readFile(outHtml, 'utf8')

  // Manifest is inlined as JSON
  expect(html).toContain('id="tojiru-manifest"')

  // Page data is inlined
  expect(html).toContain('__TOJIRU_PAGES')

  // Reader JS is inlined (loadManifest is the first function defined in reader.js)
  expect(html).toContain('function loadManifest')

  // CSS is inlined (a distinctive selector from reader.css)
  expect(html).toContain('#page, #menu')

  // Non-trivial size (pages + thumbs + reader assets)
  expect(statSync(outHtml).size).toBeGreaterThan(10_000)
})

test('temp bundle dir is removed after single-file conversion', async (ctx) => {
  if (!(await findPdfConverter())) ctx.skip()

  const pdf = join(dir, 'clean.pdf')
  await makePdf(pdf, 2)

  const outHtml = join(dir, 'clean.html')
  await convert(pdf, { outDir: '', singleFile: outHtml })

  // No pages/ or thumbs/ dirs should remain alongside the output HTML
  expect(existsSync(join(dir, 'pages'))).toBe(false)
  expect(existsSync(join(dir, 'thumbs'))).toBe(false)
})
