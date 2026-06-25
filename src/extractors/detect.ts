import { open } from 'node:fs/promises'
import type { Kind } from './types.js'

async function readMagic(file: string, n = 16): Promise<Buffer> {
  const fh = await open(file, 'r')
  try {
    const buf = Buffer.alloc(n)
    const { bytesRead } = await fh.read(buf, 0, n, 0)
    return buf.subarray(0, bytesRead)
  } finally {
    await fh.close()
  }
}

function startsWith(buf: Buffer, sig: number[]): boolean {
  if (buf.length < sig.length) return false
  return sig.every((b, i) => buf[i] === b)
}

// La détection se fait au contenu (magic bytes), pas à l'extension :
// un .cbz est souvent un RAR ou un 7z déguisé.
export async function detectKind(file: string): Promise<Kind | null> {
  const buf = await readMagic(file)

  if (startsWith(buf, [0x25, 0x50, 0x44, 0x46])) return 'pdf'        // %PDF
  if (startsWith(buf, [0x52, 0x61, 0x72, 0x21])) return 'cbr'        // Rar!
  if (startsWith(buf, [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c])) return 'cb7' // 7z
  if (startsWith(buf, [0x41, 0x54, 0x26, 0x54])) return 'djvu'       // AT&T
  if (startsWith(buf, [0x50, 0x4b, 0x03, 0x04]) || startsWith(buf, [0x50, 0x4b, 0x05, 0x06])) {
    // Zip : en v1 le seul zip supporté est le CBZ.
    return 'cbz'
  }
  return null
}
