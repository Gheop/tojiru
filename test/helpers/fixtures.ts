import { PDFDocument, StandardFonts } from 'pdf-lib'
import sharp from 'sharp'
import { writeFile } from 'node:fs/promises'

// Generates an N-page text PDF with no system binaries, for tests.
export async function makePdf(path: string, pages: number): Promise<void> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  for (let i = 1; i <= pages; i++) {
    const page = doc.addPage([420, 595])
    page.drawText(`Page ${i}`, { x: 50, y: 520, size: 36, font })
  }
  await writeFile(path, await doc.save())
}

// Generates an N-page PDF where each page is a single embedded raster image.
export async function makeImagePdf(path: string, pages: number): Promise<void> {
  const pngBuf = await sharp({
    create: { width: 200, height: 280, channels: 3, background: '#8888aa' },
  }).png().toBuffer()
  const doc = await PDFDocument.create()
  const img = await doc.embedPng(pngBuf)
  for (let i = 0; i < pages; i++) {
    const page = doc.addPage([img.width, img.height])
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height })
  }
  await writeFile(path, await doc.save())
}
