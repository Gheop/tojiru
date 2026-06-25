import { test, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { cbrExtractor } from '../src/extractors/cbr.js'

const FIXTURE = new URL('./fixtures/two.cbr', import.meta.url).pathname
let dir: string
beforeAll(() => { dir = mkdtempSync(join(tmpdir(), 'tojiru-cbr-')) })
afterAll(() => { rmSync(dir, { recursive: true, force: true }) })

test('extrait un CBR en pages raster', async (ctx) => {
  if (!existsSync(FIXTURE)) ctx.skip()
  const work = mkdtempSync(join(tmpdir(), 'tojiru-cbrwork-'))
  const doc = await cbrExtractor.extract(FIXTURE, work)
  expect(doc.kind).toBe('cbr')
  expect(doc.pages).toHaveLength(2)
  expect(doc.pages[0].type).toBe('raster')
  expect(doc.pages[0].w).toBeGreaterThan(0)
  rmSync(work, { recursive: true, force: true })
})
