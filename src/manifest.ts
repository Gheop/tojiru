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
  // Lay pages out two-up (double-page spread) instead of one per row.
  spread?: boolean
  // Right-to-left reading order (manga): flips each spread pair and the horizontal keys.
  rtl?: boolean
}

// Optional manifest fields, kept in one bag so callers don't thread a growing list of
// positional flags.
export interface ManifestExtras {
  searchable?: boolean
  outline?: OutlineEntry[]
  spread?: boolean
  rtl?: boolean
}

export function buildManifest(title: string, kind: Kind, pages: ProcessedPage[], extras: ManifestExtras = {}): Manifest {
  const m: Manifest = { tojiru: 1, title, kind, pageCount: pages.length, pages }
  if (extras.searchable) m.searchable = true
  if (extras.outline && extras.outline.length) m.outline = extras.outline
  if (extras.spread) m.spread = true
  if (extras.rtl) m.rtl = true
  return m
}
