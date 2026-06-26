import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { readerDir } from './folder.js'
import type { Manifest } from '../manifest.js'
import type { SearchEntry } from '../search.js'

const MB = 1024 * 1024
const SIZE_LIMIT = 30 * MB

function escapeScript(s: string): string {
  return s.replace(/<\/script>/gi, '<\\/script>')
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function writeSingleFile(
  manifest: Manifest,
  bundleDir: string,
  outFile: string,
  search: SearchEntry[] = [],
): Promise<void> {
  // Collect all page + thumb file paths
  const allFiles: string[] = []
  for (const p of manifest.pages) {
    allFiles.push(p.file)
    allFiles.push(p.thumb)
  }

  // Size guard: compute total bytes before building the output
  const buffers = new Map<string, Buffer>()
  let totalBytes = 0
  for (const f of allFiles) {
    const buf = await readFile(join(bundleDir, f))
    buffers.set(f, buf)
    totalBytes += buf.length
  }
  if (totalBytes > SIZE_LIMIT) {
    const mb = Math.round(totalBytes / MB)
    throw new Error(
      `Single-file output would be ~${mb} MB — too large to be practical (browsers choke on huge inline HTML). Use the folder output instead.`,
    )
  }

  // Build __TOJIRU_PAGES: file path → base64
  const pagesMap: Record<string, string> = {}
  for (const [f, buf] of buffers) {
    pagesMap[f] = buf.toString('base64')
  }

  // Read reader assets from package. The single-file HTML is derived from the same
  // index.html the folder output uses, so the body chrome lives in exactly one place:
  // inline the stylesheet and swap the external module script for the bundled data.
  const rd = readerDir()
  const indexHtml = await readFile(join(rd, 'index.html'), 'utf8')
  const css = await readFile(join(rd, 'reader.css'), 'utf8')
  const js = await readFile(join(rd, 'reader.js'), 'utf8')

  const globals = [`window.__TOJIRU_PAGES = ${escapeScript(JSON.stringify(pagesMap))};`]
  if (search.length > 0) {
    globals.push(`window.__TOJIRU_SEARCH = ${escapeScript(JSON.stringify(search))};`)
  }

  const inlineScripts = [
    `<script type="application/json" id="tojiru-manifest">${escapeScript(JSON.stringify(manifest))}</script>`,
    '<script>',
    globals.join('\n'),
    '</script>',
    '<script type="module">',
    escapeScript(js),
    '</script>',
  ].join('\n')

  const html = indexHtml
    .replace('<title>tojiru</title>', `<title>${escapeHtml(manifest.title)}</title>`)
    .replace('<link rel="stylesheet" href="reader.css" />', `<style>\n${css}\n</style>`)
    .replace('<script type="module" src="reader.js"></script>', inlineScripts)

  await writeFile(outFile, html)
}
