import { test, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { makeComic } from './helpers/comics.js'
import { cbzExtractor } from '../src/extractors/cbz.js'

let dir: string
beforeAll(() => { dir = mkdtempSync(join(tmpdir(), 'tojiru-cbz-')) })
afterAll(() => { rmSync(dir, { recursive: true, force: true }) })

test('extracts a CBZ into sorted raster pages with dimensions', async () => {
  const cbz = join(dir, 'bd.cbz')
  await makeComic('zip', cbz, 3)
  const work = mkdtempSync(join(tmpdir(), 'tojiru-cbzwork-'))
  const doc = await cbzExtractor.extract(cbz, work)
  expect(doc.kind).toBe('cbz')
  expect(doc.pages).toHaveLength(3)
  expect(doc.pages[0].type).toBe('raster')
  expect(doc.pages[0].w).toBeGreaterThan(0)
  expect(doc.pages[0].h).toBeGreaterThan(0)
  rmSync(work, { recursive: true, force: true })
})

test('extracts a CBZ whose entries have a leading slash', async () => {
  const fixture = new URL('./fixtures/leading-slash.cbz', import.meta.url).pathname
  const work = mkdtempSync(join(tmpdir(), 'tojiru-cbzslash-'))
  try {
    const doc = await cbzExtractor.extract(fixture, work)
    expect(doc.pages).toHaveLength(2)
    expect(doc.pages[0].type).toBe('raster')
    expect((doc.pages[0] as any).w).toBeGreaterThanOrEqual(1)
    expect((doc.pages[0] as any).h).toBeGreaterThanOrEqual(1)
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
})
