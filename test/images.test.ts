import { test, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { isImage, naturalCompare, imageDims } from '../src/extractors/images.js'

let dir: string
beforeAll(() => { dir = mkdtempSync(join(tmpdir(), 'tojiru-img-')) })
afterAll(() => { rmSync(dir, { recursive: true, force: true }) })

test('isImage reconnaît les extensions image, rejette le reste', () => {
  expect(isImage('p01.JPG')).toBe(true)
  expect(isImage('a.png')).toBe(true)
  expect(isImage('ComicInfo.xml')).toBe(false)
  expect(isImage('Thumbs.db')).toBe(false)
})

test('naturalCompare trie page2 avant page10', () => {
  const a = ['page10.jpg', 'page2.jpg', 'page1.jpg']
  a.sort(naturalCompare)
  expect(a).toEqual(['page1.jpg', 'page2.jpg', 'page10.jpg'])
})

test('imageDims lit les dimensions en pixels', async () => {
  const p = join(dir, 'x.png')
  await sharp({ create: { width: 120, height: 80, channels: 3, background: '#fff' } }).png().toFile(p)
  expect(await imageDims(p)).toEqual({ w: 120, h: 80 })
})
