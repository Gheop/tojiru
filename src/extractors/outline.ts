import { hasBinary } from '../tools.js'
import { run } from '../run.js'
import type { OutlineEntry } from './types.js'

// Parses the output of `mutool show <pdf> outline`. Each line looks like:
//   <marker><TAB×(depth+1)>"<title>"<TAB>#page=<n>
// where marker is '-' (the entry has children) or '|' (leaf/sibling), and the depth is
// the number of tabs before the title minus one. Entries whose destination carries no
// page number (external links, unresolved named destinations) are dropped, since the
// reader can only jump to a page.
export function parseOutline(stdout: string): OutlineEntry[] {
  const out: OutlineEntry[] = []
  for (const line of stdout.split('\n')) {
    const m = line.match(/^[-|](\t+)"(.*)"\t#(.+)$/)
    if (!m) continue
    const page = m[3].match(/page=(\d+)/)
    const title = m[2].trim()
    if (!title || !page) continue
    out.push({ title, page: Number(page[1]), depth: Math.max(0, m[1].length - 1) })
  }
  return out
}

// Extracts a PDF outline via mutool. Returns an empty list when mutool is absent or the
// document has no outline — the table of contents is a bonus, never a hard requirement.
export async function extractOutline(file: string): Promise<OutlineEntry[]> {
  if (!(await hasBinary('mutool'))) return []
  try {
    const { stdout } = await run('mutool', ['show', file, 'outline'])
    return parseOutline(stdout)
  } catch {
    return []
  }
}
