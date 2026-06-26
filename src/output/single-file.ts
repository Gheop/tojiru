import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { readerDir } from './folder.js'
import type { Manifest } from '../manifest.js'

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

  // Read reader assets from package
  const rd = readerDir()
  const css = await readFile(join(rd, 'reader.css'), 'utf8')
  const js = await readFile(join(rd, 'reader.js'), 'utf8')

  const html = [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${escapeHtml(manifest.title)}</title>`,
    '<style>',
    css,
    '</style>',
    '</head>',
    '<body>',
    '<div id="reduce" title="Collapse / expand thumbnails">☰</div>',
    '<nav id="menu" aria-label="Pages"></nav>',
    '<div id="resize" title="Drag to resize"></div>',
    '<main id="page"></main>',
    `<script type="application/json" id="tojiru-manifest">${escapeScript(JSON.stringify(manifest))}</script>`,
    '<script>',
    `window.__TOJIRU_PAGES = ${escapeScript(JSON.stringify(pagesMap))};`,
    '</script>',
    '<script type="module">',
    escapeScript(js),
    '</script>',
    '</body>',
    '</html>',
    '',
  ].join('\n')

  await writeFile(outFile, html)
}
