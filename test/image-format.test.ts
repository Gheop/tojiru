import { test, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { processPages } from '../src/pages.js'
import type { Document } from '../src/extractors/types.js'

let dir: string
beforeAll(() => { dir = mkdtempSync(join(tmpdir(), 'tojiru-imgfmt-')) })
afterAll(() => { rmSync(dir, { recursive: true, force: true }) })

async function rasterDoc(): Promise<Document> {
  const a = join(dir, 'a.png')
  const b = join(dir, 'b.png')
  await sharp({ create: { width: 120, height: 160, channels: 3, background: '#c0ffee' } }).png().toFile(a)
  await sharp({ create: { width: 120, height: 160, channels: 3, background: '#bada55' } }).webp().toFile(b.replace(/\.png$/, '.webp'))
  return {
    title: 'Comic',
    kind: 'cbz',
    pages: [
      { type: 'raster', imagePath: a, w: 120, h: 160 },
      { type: 'raster', imagePath: b.replace(/\.png$/, '.webp'), w: 120, h: 160 },
    ],
  }
}

test('image-format keep copies raster pages with their original extension', async () => {
  const out = mkdtempSync(join(tmpdir(), 'tojiru-keep-'))
  try {
    const pages = await processPages(await rasterDoc(), out, { imageFormat: 'keep' })
    expect(pages[0].file).toMatch(/\.png$/)
    expect(pages[1].file).toMatch(/\.webp$/)
  } finally {
    rmSync(out, { recursive: true, force: true })
  }
})

test('image-format webp re-encodes non-webp pages and leaves webp sources alone', async () => {
  const out = mkdtempSync(join(tmpdir(), 'tojiru-webp-'))
  try {
    const pages = await processPages(await rasterDoc(), out, { imageFormat: 'webp' })
    // PNG source → re-encoded to webp.
    expect(pages[0].file).toMatch(/\.webp$/)
    const meta = await sharp(join(out, pages[0].file)).metadata()
    expect(meta.format).toBe('webp')
    // Already-webp source → kept as webp (not double-encoded into a nested name).
    expect(pages[1].file).toMatch(/\.webp$/)
  } finally {
    rmSync(out, { recursive: true, force: true })
  }
})
