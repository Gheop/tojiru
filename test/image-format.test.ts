import { test, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync, statSync } from 'node:fs'
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

test('quality controls the lossy webp page size', async () => {
  // Random noise is high-entropy, so the quality knob has a measurable effect.
  const noise = Buffer.alloc(300 * 300 * 3)
  for (let i = 0; i < noise.length; i++) noise[i] = (i * 1103515245 + 12345) & 0xff
  const src = join(dir, 'noise.png')
  await sharp(noise, { raw: { width: 300, height: 300, channels: 3 } }).png().toFile(src)
  const doc: Document = { title: 'N', kind: 'cbz', pages: [{ type: 'raster', imagePath: src, w: 300, h: 300 }] }

  const low = mkdtempSync(join(tmpdir(), 'tojiru-q40-'))
  const high = mkdtempSync(join(tmpdir(), 'tojiru-q90-'))
  try {
    const lo = await processPages(doc, low, { imageFormat: 'webp', quality: 40 })
    const hi = await processPages(doc, high, { imageFormat: 'webp', quality: 90 })
    const loBytes = statSync(join(low, lo[0].file)).size
    const hiBytes = statSync(join(high, hi[0].file)).size
    expect(loBytes).toBeLessThan(hiBytes)
  } finally {
    rmSync(low, { recursive: true, force: true })
    rmSync(high, { recursive: true, force: true })
  }
})
