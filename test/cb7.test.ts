import { test, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { makeComic } from './helpers/comics.js'
import { cb7Extractor } from '../src/extractors/cb7.js'
import { hasBinary } from '../src/tools.js'

let dir: string
beforeAll(() => { dir = mkdtempSync(join(tmpdir(), 'tojiru-cb7-')) })
afterAll(() => { rmSync(dir, { recursive: true, force: true }) })

test('extrait un CB7 en pages raster', async (ctx) => {
  if (!(await hasBinary('7z'))) ctx.skip()
  const cb7 = join(dir, 'bd.cb7')
  await makeComic('7z', cb7, 3)
  const work = mkdtempSync(join(tmpdir(), 'tojiru-cb7work-'))
  const doc = await cb7Extractor.extract(cb7, work)
  expect(doc.kind).toBe('cb7')
  expect(doc.pages).toHaveLength(3)
  expect(doc.pages[0].type).toBe('raster')
  rmSync(work, { recursive: true, force: true })
})
