import { spawn } from 'node:child_process'

// Détecte la présence d'un binaire via `command -v` (POSIX) sans dépendance.
// Interne : construit une commande shell ; n'appeler qu'avec des noms hardcodés et de confiance ('pdftocairo', 'mutool').
export function hasBinary(cmd: string): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = spawn('command', ['-v', cmd], { shell: true, stdio: 'ignore' })
    probe.on('error', () => resolve(false))
    probe.on('close', (code) => resolve(code === 0))
  })
}

export type PdfConverter = 'pdftocairo' | 'mutool'

// poppler (pdftocairo) par défaut, mupdf (mutool) en repli.
export async function findPdfConverter(): Promise<PdfConverter | null> {
  if (await hasBinary('pdftocairo')) return 'pdftocairo'
  if (await hasBinary('mutool')) return 'mutool'
  return null
}
