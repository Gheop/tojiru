import { test, expect } from 'vitest'
import { buildManifest } from '../src/manifest.js'
import type { ProcessedPage } from '../src/pages.js'

test('assemble un manifeste versionné avec le compte de pages', () => {
  const pages: ProcessedPage[] = [
    { n: 1, type: 'vector', w: 100, h: 200, file: 'pages/0001.svgz', thumb: 'thumbs/0001.webp' },
  ]
  const m = buildManifest('Mon livre', 'pdf', pages)
  expect(m.tojiru).toBe(1)
  expect(m.title).toBe('Mon livre')
  expect(m.kind).toBe('pdf')
  expect(m.pageCount).toBe(1)
  expect(m.pages).toBe(pages)
})
