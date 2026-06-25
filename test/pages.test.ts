import { test, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { processPages } from '../src/pages.js'
import type { Document } from '../src/extractors/types.js'

let dir: string
beforeAll(() => { dir = mkdtempSync(join(tmpdir(), 'tojiru-pages-')) })
afterAll(() => { rmSync(dir, { recursive: true, force: true }) })

test('produces a .svgz and a .webp thumbnail per vector page', async () => {
  const svgPath = join(dir, 'src.svg')
  writeFileSync(svgPath, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200"><rect width="100" height="200" fill="#333"/></svg>')
  const out = join(dir, 'out')
  const doc: Document = { title: 't', kind: 'pdf', pages: [{ type: 'vector', svgPath, w: 100, h: 200 }] }

  const processed = await processPages(doc, out)

  expect(processed).toHaveLength(1)
  expect(processed[0].file).toBe('pages/0001.svgz')
  expect(processed[0].thumb).toBe('thumbs/0001.webp')
  expect(processed[0].w).toBe(100)
  expect(existsSync(join(out, 'pages/0001.svgz'))).toBe(true)
  expect(existsSync(join(out, 'thumbs/0001.webp'))).toBe(true)
  // the .svgz decompresses correctly to SVG
  const svg = gunzipSync(readFileSync(join(out, 'pages/0001.svgz'))).toString('utf8')
  expect(svg).toContain('<svg')
})
