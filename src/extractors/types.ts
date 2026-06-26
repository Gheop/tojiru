export type Kind = 'pdf' | 'cbz' | 'cbr' | 'cb7' | 'djvu'

export interface VectorPage { type: 'vector'; svgPath: string; w: number; h: number }
export interface RasterPage { type: 'raster'; imagePath: string; w: number; h: number }
export type Page = VectorPage | RasterPage

export interface Document {
  title: string
  kind: Kind
  pages: Page[]
}

export type ProgressFn = (done: number, total: number, label: string) => void

// Quality (1-100) for lossy WebP encoding of raster pages. Ignored by extractors
// that emit vector or lossless output (DjVu renders bitonal scans as lossless WebP).
export interface ExtractOptions { quality?: number }

// Default lossy WebP quality. Measured sweet spot for comic pages: q80 is ~8% lighter
// than q82 with no visible loss, and the JPEG-sourced material tolerates it well.
export const DEFAULT_QUALITY = 80

export interface Extractor {
  name: Kind
  canHandle(file: string): Promise<boolean>
  extract(file: string, workdir: string, onProgress?: ProgressFn, opts?: ExtractOptions): Promise<Document>
}
