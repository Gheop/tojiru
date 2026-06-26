import type { Document } from './extractors/types.js'

// One searchable page: its 1-based number and its plain text.
export interface SearchEntry { n: number; t: string }

// Builds the client search index from a document's per-page text. Pages with no text
// (scans, comics, blank pages) are dropped, so an all-image document yields an empty
// index and the reader keeps the browser's native find.
export function buildSearchIndex(doc: Document): SearchEntry[] {
  const entries: SearchEntry[] = []
  doc.pages.forEach((p, i) => {
    const t = p.text?.trim()
    if (t) entries.push({ n: i + 1, t })
  })
  return entries
}
