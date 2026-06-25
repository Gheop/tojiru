import sharp from 'sharp'

const IMAGE_RE = /\.(jpe?g|png|gif|webp|bmp)$/i

export function isImage(name: string): boolean {
  return IMAGE_RE.test(name)
}

// Tri naturel : compare les segments numériques par valeur, le reste lexicalement.
export function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
}

export async function imageDims(path: string): Promise<{ w: number; h: number }> {
  const m = await sharp(path).metadata()
  if (!m.width || !m.height) throw new Error(`Cannot read dimensions: ${path}`)
  return { w: m.width, h: m.height }
}
