import { test, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeFolder } from '../src/output/folder.js'
import type { Manifest } from '../src/manifest.js'

let dir: string
beforeAll(() => { dir = mkdtempSync(join(tmpdir(), 'tojiru-folder-')) })
afterAll(() => { rmSync(dir, { recursive: true, force: true }) })

test('writes manifest.json and copies the reader files', async () => {
  const m: Manifest = { tojiru: 1, title: 'X', kind: 'pdf', pageCount: 0, pages: [] }
  await writeFolder(m, dir)
  expect(existsSync(join(dir, 'manifest.json'))).toBe(true)
  expect(existsSync(join(dir, 'index.html'))).toBe(true)
  expect(existsSync(join(dir, 'reader.js'))).toBe(true)
  expect(existsSync(join(dir, 'reader.css'))).toBe(true)
  expect(JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8')).title).toBe('X')
})
