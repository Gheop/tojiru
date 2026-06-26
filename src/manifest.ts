import type { Kind } from './extractors/types.js'
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
}

export function buildManifest(title: string, kind: Kind, pages: ProcessedPage[], searchable = false): Manifest {
  const m: Manifest = { tojiru: 1, title, kind, pageCount: pages.length, pages }
  if (searchable) m.searchable = true
  return m
}
