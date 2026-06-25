import { PDFDocument, StandardFonts } from 'pdf-lib'
import { writeFile } from 'node:fs/promises'

// Génère un PDF de N pages, sans aucun binaire système, pour les tests.
export async function makePdf(path: string, pages: number): Promise<void> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  for (let i = 1; i <= pages; i++) {
    const page = doc.addPage([420, 595])
    page.drawText(`Page ${i}`, { x: 50, y: 520, size: 36, font })
  }
  await writeFile(path, await doc.save())
}
