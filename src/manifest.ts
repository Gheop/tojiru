import type { Kind } from './extractors/types.js'
import type { ProcessedPage } from './pages.js'

export interface Manifest {
  tojiru: 1
  title: string
  kind: Kind
  pageCount: number
  pages: ProcessedPage[]
}

export function buildManifest(title: string, kind: Kind, pages: ProcessedPage[]): Manifest {
  return { tojiru: 1, title, kind, pageCount: pages.length, pages }
}
