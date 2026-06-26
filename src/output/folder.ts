import { mkdir, writeFile, copyFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import type { Manifest } from '../manifest.js'
import type { SearchEntry } from '../search.js'

// reader/ is at the package root. Whether running from dist/output/ or src/output/,
// we go up two levels.
export function readerDir(): string {
  return fileURLToPath(new URL('../../reader/', import.meta.url))
}

export async function writeFolder(manifest: Manifest, outDir: string, search: SearchEntry[] = []): Promise<void> {
  await mkdir(outDir, { recursive: true })
  await writeFile(join(outDir, 'manifest.json'), JSON.stringify(manifest))
  // The search index is its own file so the reader fetches it lazily on first search,
  // keeping the eagerly-loaded manifest small.
  if (search.length > 0) {
    await writeFile(join(outDir, 'search.json'), JSON.stringify(search))
  }
  const rd = readerDir()
  for (const f of ['index.html', 'reader.js', 'reader.css']) {
    await copyFile(join(rd, f), join(outDir, f))
  }
}
