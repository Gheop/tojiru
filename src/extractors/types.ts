export type Kind = 'pdf' | 'cbz' | 'cbr' | 'cb7' | 'djvu'

export interface VectorPage { type: 'vector'; svgPath: string; w: number; h: number }
export interface RasterPage { type: 'raster'; imagePath: string; w: number; h: number }
export type Page = VectorPage | RasterPage

export interface Document {
  title: string
  kind: Kind
  pages: Page[]
}

export interface Extractor {
  name: Kind
  canHandle(file: string): Promise<boolean>
  extract(file: string, workdir: string): Promise<Document>
}
