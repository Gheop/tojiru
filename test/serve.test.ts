import { test, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import http from 'node:http'
import { serve } from '../src/serve.js'

let dir: string
let url: string
let port: number
let parentFile: string
let close: () => void

beforeAll(async () => {
  const baseTmp = mkdtempSync(join(tmpdir(), 'tojiru-test-'))
  dir = join(baseTmp, 'serve')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), '<html><body>hello</body></html>')
  writeFileSync(join(dir, 'manifest.json'), '{"title":"test"}')
  // Create a file in the parent directory to test path traversal
  parentFile = join(baseTmp, 'parent-file.txt')
  writeFileSync(parentFile, 'should not be served')
  const s = await serve(dir)
  url = s.url
  close = s.close
  const portMatch = url.match(/:(\d+)$/)
  port = portMatch ? parseInt(portMatch[1], 10) : 8000
})

afterAll(() => {
  close()
  rmSync(dir, { recursive: true, force: true })
  // Clean up parent directory
  const baseTmp = join(dir, '..')
  rmSync(baseTmp, { recursive: true, force: true })
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
  const status = await new Promise<number>((resolve, reject) => {
    const req = http.request({ hostname: 'localhost', port, path: '/../parent-file.txt', method: 'GET' }, (r) => {
      r.resume()
      resolve(r.statusCode ?? 0)
    })
    req.on('error', reject)
    req.end()
  })
  expect(status).toBe(404)
})

test('missing file returns 404', async () => {
  const res = await fetch(`${url}/nonexistent.txt`)
  expect(res.status).toBe(404)
})
