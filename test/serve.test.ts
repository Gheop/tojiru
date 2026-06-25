import { test, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { serve } from '../src/serve.js'

let dir: string
let url: string
let close: () => void

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'tojiru-serve-'))
  writeFileSync(join(dir, 'index.html'), '<html><body>hello</body></html>')
  writeFileSync(join(dir, 'manifest.json'), '{"title":"test"}')
  const s = await serve(dir)
  url = s.url
  close = s.close
})

afterAll(() => {
  close()
  rmSync(dir, { recursive: true, force: true })
})

test('GET / returns 200 with text/html content-type', async () => {
  const res = await fetch(`${url}/`)
  expect(res.status).toBe(200)
  expect(res.headers.get('content-type')).toBe('text/html')
  const body = await res.text()
  expect(body).toContain('hello')
})

test('GET /manifest.json returns 200 with application/json content-type', async () => {
  const res = await fetch(`${url}/manifest.json`)
  expect(res.status).toBe(200)
  expect(res.headers.get('content-type')).toBe('application/json')
  const body = await res.json()
  expect(body).toEqual({ title: 'test' })
})

test('path traversal returns 404', async () => {
  const res = await fetch(`${url}/../package.json`)
  expect(res.status).toBe(404)
})

test('missing file returns 404', async () => {
  const res = await fetch(`${url}/nonexistent.txt`)
  expect(res.status).toBe(404)
})
