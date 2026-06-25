import { test, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { makePdf } from './helpers/fixtures.js'
import { detectKind } from '../src/extractors/detect.js'
import { findPdfConverter } from '../src/tools.js'

let dir: string
beforeAll(() => { dir = mkdtempSync(join(tmpdir(), 'tojiru-cli-')) })
afterAll(() => { rmSync(dir, { recursive: true, force: true }) })

test('le PDF généré est bien détecté comme pdf', async () => {
  const pdf = join(dir, 'livre.pdf')
  await makePdf(pdf, 3)
  expect(await detectKind(pdf)).toBe('pdf')
})

test('le pipeline complet produit un bundle lisible', async () => {
  if (!(await findPdfConverter())) {
    console.warn('Aucun convertisseur PDF, test sauté')
    return
  }
  const { convertForTest } = await import('./helpers/convert.js')
  const pdf = join(dir, 'livre2.pdf')
  await makePdf(pdf, 2)
  const out = join(dir, 'bundle')
  await convertForTest(pdf, out)
  expect(existsSync(join(out, 'manifest.json'))).toBe(true)
  expect(existsSync(join(out, 'pages/0001.svgz'))).toBe(true)
  expect(existsSync(join(out, 'index.html'))).toBe(true)
})
