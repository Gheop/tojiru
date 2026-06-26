import { test, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { makePdf } from './helpers/fixtures.js'
import { findPdfConverter } from '../src/tools.js'
import { convert } from '../src/convert.js'

let dir: string
beforeAll(() => { dir = mkdtempSync(join(tmpdir(), 'tojiru-spread-')) })
afterAll(() => { rmSync(dir, { recursive: true, force: true }) })

test('--spread and --rtl flow into the manifest', async (ctx) => {
  if (!(await findPdfConverter())) ctx.skip()

  const pdf = join(dir, 'doc.pdf')
  await makePdf(pdf, 2)
  const out = join(dir, 'bundle')
  await convert(pdf, { outDir: out, spread: true, rtl: true })

  const manifest = JSON.parse(await readFile(join(out, 'manifest.json'), 'utf8'))
  expect(manifest.spread).toBe(true)
  expect(manifest.rtl).toBe(true)
})

test('--paged sets the default reading layout', async (ctx) => {
  if (!(await findPdfConverter())) ctx.skip()

  const pdf = join(dir, 'paged.pdf')
  await makePdf(pdf, 2)
  const out = join(dir, 'paged-bundle')
  await convert(pdf, { outDir: out, paged: true })

  const manifest = JSON.parse(await readFile(join(out, 'manifest.json'), 'utf8'))
  expect(manifest.layout).toBe('paged')
})

test('without the flags the manifest carries no layout fields', async (ctx) => {
  if (!(await findPdfConverter())) ctx.skip()

  const pdf = join(dir, 'plain.pdf')
  await makePdf(pdf, 2)
  const out = join(dir, 'plain-bundle')
  await convert(pdf, { outDir: out })

  const manifest = JSON.parse(await readFile(join(out, 'manifest.json'), 'utf8'))
  expect(manifest.spread).toBeUndefined()
  expect(manifest.rtl).toBeUndefined()
  expect(manifest.layout).toBeUndefined()
})
