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

test('image-format webp keeps the original page when webp would be larger', async () => {
  // Flat colour PNG: WebP crushes it (WebP wins).
  const flat = join(dir, 'flat.png')
  await sharp({ create: { width: 200, height: 200, channels: 3, background: '#abcdef' } }).png().toFile(flat)
  // High-entropy noise stored as a tiny quality-1 JPEG: re-encoding to WebP q80 would be
  // much bigger, so the original must be kept.
  const noise = Buffer.alloc(300 * 300 * 3)
  for (let i = 0; i < noise.length; i++) noise[i] = (i * 1103515245 + 12345) & 0xff
  const tinyJpg = join(dir, 'tiny.jpg')
  await sharp(noise, { raw: { width: 300, height: 300, channels: 3 } }).jpeg({ quality: 1 }).toFile(tinyJpg)

  const doc: Document = {
    title: 'Mix', kind: 'cbz',
    pages: [
      { type: 'raster', imagePath: flat, w: 200, h: 200 },
      { type: 'raster', imagePath: tinyJpg, w: 300, h: 300 },
    ],
  }
  const out = mkdtempSync(join(tmpdir(), 'tojiru-smaller-'))
  try {
    const pages = await processPages(doc, out, { imageFormat: 'webp' })
    expect(pages[0].file).toMatch(/\.webp$/) // PNG → WebP won
    expect(pages[1].file).toMatch(/\.jpg$/)  // tiny JPEG → original kept
    // The guarantee: no output page is larger than its source.
    expect(statSync(join(out, pages[0].file)).size).toBeLessThanOrEqual(statSync(flat).size)
    expect(statSync(join(out, pages[1].file)).size).toBeLessThanOrEqual(statSync(tinyJpg).size)
  } finally {
    rmSync(out, { recursive: true, force: true })
  }
})

test('quality controls the lossy webp page size', async () => {
  // A smooth gradient with fine grain: lossless PNG must store the grain (so WebP always
  // wins the size race and is actually used), while the quality knob trims the grain, so
  // it has a measurable effect on the WebP output.
  const W = 384, H = 384
  const buf = Buffer.alloc(W * H * 3)
  let seed = 1
  const grain = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return (seed & 0xff) }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = Math.min(255, Math.max(0, Math.round((x / W) * 200 + (grain() - 128) * 0.5)))
      const i = (y * W + x) * 3
      buf[i] = v; buf[i + 1] = v; buf[i + 2] = v
    }
  }
  const src = join(dir, 'grain.png')
  await sharp(buf, { raw: { width: W, height: H, channels: 3 } }).png().toFile(src)
  const doc: Document = { title: 'N', kind: 'cbz', pages: [{ type: 'raster', imagePath: src, w: W, h: H }] }

  const low = mkdtempSync(join(tmpdir(), 'tojiru-q40-'))
  const high = mkdtempSync(join(tmpdir(), 'tojiru-q90-'))
  try {
    const lo = await processPages(doc, low, { imageFormat: 'webp', quality: 40 })
    const hi = await processPages(doc, high, { imageFormat: 'webp', quality: 90 })
    expect(lo[0].file).toMatch(/\.webp$/) // WebP was actually chosen over the PNG
    expect(hi[0].file).toMatch(/\.webp$/)
    const loBytes = statSync(join(low, lo[0].file)).size
    const hiBytes = statSync(join(high, hi[0].file)).size
    expect(loBytes).toBeLessThan(hiBytes)
  } finally {
    rmSync(low, { recursive: true, force: true })
    rmSync(high, { recursive: true, force: true })
  }
})
