import { test, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseOutline, extractOutline } from '../src/extractors/outline.js'
import { hasBinary, findPdfConverter } from '../src/tools.js'
import { convert } from '../src/convert.js'

const FIXTURE = new URL('./fixtures/outline.pdf', import.meta.url).pathname

test('parseOutline reads titles, pages and nesting depth from mutool output', () => {
  const sample = [
    '-\t"Part One"\t#page=1',
    '|\t\t"Chapter A"\t#page=2',
    '|\t\t\t"Section A.1"\t#page=2',
    '|\t"Part Two"\t#page=4',
  ].join('\n')

  expect(parseOutline(sample)).toEqual([
    { title: 'Part One', page: 1, depth: 0 },
    { title: 'Chapter A', page: 2, depth: 1 },
    { title: 'Section A.1', page: 2, depth: 2 },
    { title: 'Part Two', page: 4, depth: 0 },
  ])
})

test('parseOutline drops entries with no page destination and ignores noise', () => {
  const sample = [
    'some header line',
    '-\t"Has page"\t#page=3',
    '|\t"External"\t#https://example.com',
    '',
  ].join('\n')

  expect(parseOutline(sample)).toEqual([{ title: 'Has page', page: 3, depth: 0 }])
})

let dir: string
beforeAll(() => { dir = mkdtempSync(join(tmpdir(), 'tojiru-toc-')) })
afterAll(() => { rmSync(dir, { recursive: true, force: true }) })

test('a bookmarked PDF carries its outline into the manifest', async (ctx) => {
  if (!(await findPdfConverter()) || !(await hasBinary('mutool'))) ctx.skip()

  const out = join(dir, 'booked')
  await convert(FIXTURE, { outDir: out })

  const manifest = JSON.parse(await readFile(join(out, 'manifest.json'), 'utf8'))
  expect(manifest.outline[0]).toEqual({ title: 'Part One', page: 1, depth: 0 })
  expect(manifest.outline.find((e: { title: string }) => e.title.startsWith('Accents'))).toBeTruthy()
})

test('extractOutline returns the entries directly from the fixture', async (ctx) => {
  if (!(await hasBinary('mutool'))) ctx.skip()
  const entries = await extractOutline(FIXTURE)
  expect(entries.map((e) => e.title)).toContain('Chapter B')
})
