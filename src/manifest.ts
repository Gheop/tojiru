import type { Kind, OutlineEntry } from './extractors/types.js'
import type { ProcessedPage } from './pages.js'

export interface Manifest {
  tojiru: 1
  title: string
  kind: Kind
  pageCount: number
  pages: ProcessedPage[]
  // True when a search index ships alongside (search.json in folder mode, or the
  // inline __TOJIRU_SEARCH global). The reader enables its search box only then.
  searchable?: boolean
  // The document's table of contents, when it has one. Small enough to inline here.
  outline?: OutlineEntry[]
}

export function buildManifest(
  title: string,
  kind: Kind,
  pages: ProcessedPage[],
  searchable = false,
  outline?: OutlineEntry[],
): Manifest {
  const m: Manifest = { tojiru: 1, title, kind, pageCount: pages.length, pages }
  if (searchable) m.searchable = true
  if (outline && outline.length) m.outline = outline
  return m
}
