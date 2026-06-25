import { test, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { detectKind } from '../src/extractors/detect.js'

let dir: string
beforeAll(() => { dir = mkdtempSync(join(tmpdir(), 'tojiru-detect-')) })
afterAll(() => { rmSync(dir, { recursive: true, force: true }) })

function fixture(name: string, bytes: number[]): string {
  const p = join(dir, name)
  writeFileSync(p, Buffer.from(bytes))
  return p
}

test('détecte un PDF par magic bytes même avec une mauvaise extension', async () => {
  const p = fixture('faux.cbz', [0x25, 0x50, 0x44, 0x46, 0x2d]) // %PDF-
  expect(await detectKind(p)).toBe('pdf')
})

test('détecte un zip (cbz) par signature PK', async () => {
  const p = fixture('bd.cbz', [0x50, 0x4b, 0x03, 0x04])
  expect(await detectKind(p)).toBe('cbz')
})

test('rend null pour un contenu inconnu', async () => {
  const p = fixture('mystere.bin', [0x00, 0x01, 0x02, 0x03])
  expect(await detectKind(p)).toBeNull()
})
