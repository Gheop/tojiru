import { test, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync, existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { makePdf } from './helpers/fixtures.js'
import { makeComic } from './helpers/comics.js'
import { hasBinary } from '../src/tools.js'
import { findPdfConverter } from '../src/tools.js'
import { convert } from '../src/convert.js'

let dir: string
beforeAll(() => { dir = mkdtempSync(join(tmpdir(), 'tojiru-search-')) })
afterAll(() => { rmSync(dir, { recursive: true, force: true }) })

test('a born-digital PDF emits search.json and marks the manifest searchable', async (ctx) => {
  if (!(await findPdfConverter()) || !(await hasBinary('pdftotext'))) ctx.skip()

  const pdf = join(dir, 'text.pdf')
  await makePdf(pdf, 3) // each page draws "Page N"
  const out = join(dir, 'text-bundle')
  await convert(pdf, { outDir: out })

  const search = JSON.parse(await readFile(join(out, 'search.json'), 'utf8'))
  expect(search).toHaveLength(3)
  expect(search[0]).toMatchObject({ n: 1 })
  expect(search[1].t).toContain('Page 2')

  const manifest = JSON.parse(await readFile(join(out, 'manifest.json'), 'utf8'))
  expect(manifest.searchable).toBe(true)
})

test('an image-only comic produces no search index', async (ctx) => {
  if (!(await hasBinary('7z'))) ctx.skip()

  const cbz = join(dir, 'comic.cbz')
  await makeComic('zip', cbz, 2)
  const out = join(dir, 'comic-bundle')
  await convert(cbz, { outDir: out })

  expect(existsSync(join(out, 'search.json'))).toBe(false)
  const manifest = JSON.parse(await readFile(join(out, 'manifest.json'), 'utf8'))
  expect(manifest.searchable).toBeUndefined()
})
