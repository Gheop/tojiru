import { mkdir, writeFile, copyFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import type { Manifest } from '../manifest.js'

// reader/ est à la racine du paquet. Depuis dist/output/ comme depuis src/output/,
// on remonte de deux niveaux.
export function readerDir(): string {
  return fileURLToPath(new URL('../../reader/', import.meta.url))
}

export async function writeFolder(manifest: Manifest, outDir: string): Promise<void> {
  await mkdir(outDir, { recursive: true })
  await writeFile(join(outDir, 'manifest.json'), JSON.stringify(manifest))
  const rd = readerDir()
  for (const f of ['index.html', 'reader.js', 'reader.css']) {
    await copyFile(join(rd, f), join(outDir, f))
  }
}
