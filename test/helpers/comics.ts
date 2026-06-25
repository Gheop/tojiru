import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { spawnSync } from 'node:child_process'

// Génère une archive d'images (zip ou 7z) avec N pages, via le binaire 7z.
export async function makeComic(kind: 'zip' | '7z', out: string, pages: number): Promise<void> {
  const work = await mkdtemp(join(tmpdir(), 'tojiru-mk-'))
  try {
    for (let i = 1; i <= pages; i++) {
      const w = 100 + i, h = 150 + i
      await sharp({ create: { width: w, height: h, channels: 3, background: '#ccddee' } })
        .png().toFile(join(work, `page${String(i).padStart(2, '0')}.png`))
    }
    const type = kind === 'zip' ? '-tzip' : '-t7z'
    const r = spawnSync('7z', ['a', type, out, join(work, '*.png')], { stdio: 'ignore', shell: true })
    if (r.status !== 0) throw new Error('7z a échoué pour la fixture')
  } finally {
    await rm(work, { recursive: true, force: true })
  }
}
