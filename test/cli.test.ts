import { test, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { makePdf } from './helpers/fixtures.js'
import { detectKind } from '../src/extractors/detect.js'
import { findPdfConverter } from '../src/tools.js'
import { convert } from '../src/convert.js'

let dir: string
beforeAll(() => { dir = mkdtempSync(join(tmpdir(), 'tojiru-cli-')) })
afterAll(() => { rmSync(dir, { recursive: true, force: true }) })

test('the generated PDF is correctly detected as pdf', async () => {
  const pdf = join(dir, 'livre.pdf')
  await makePdf(pdf, 3)
  expect(await detectKind(pdf)).toBe('pdf')
})

test('the full pipeline produces a readable bundle', async (ctx) => {
  if (!(await findPdfConverter())) ctx.skip()
  const pdf = join(dir, 'livre2.pdf')
  await makePdf(pdf, 2)
  const out = join(dir, 'bundle')
  await convert(pdf, { outDir: out })
  expect(existsSync(join(out, 'manifest.json'))).toBe(true)
  expect(existsSync(join(out, 'pages/0001.svgz'))).toBe(true)
  expect(existsSync(join(out, 'index.html'))).toBe(true)
})
