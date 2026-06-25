import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { run } from '../../src/run.js'

// Builds an N-page .djvu: sharp -> jpeg -> c44 -> single-page djvu -> djvm combine.
export async function makeDjvu(out: string, pages: number): Promise<void> {
  const work = await mkdtemp(join(tmpdir(), 'tojiru-mkdjvu-'))
  try {
    const parts: string[] = []
    for (let i = 1; i <= pages; i++) {
      const jpg = join(work, `p${i}.jpg`), dj = join(work, `p${i}.djvu`)
      await sharp({ create: { width: 200, height: 300, channels: 3, background: '#eef' } }).jpeg().toFile(jpg)
      await run('c44', [jpg, dj])
      parts.push(dj)
    }
    await run('djvm', ['-c', out, ...parts])
  } finally {
    await rm(work, { recursive: true, force: true })
  }
}
