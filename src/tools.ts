import { spawn } from 'node:child_process'

// Detects the presence of a binary via `command -v` (POSIX) with no dependencies.
// Internal: builds a shell command; call only with hardcoded trusted names ('pdftocairo', 'mutool').
export function hasBinary(cmd: string): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = spawn('command', ['-v', cmd], { shell: true, stdio: 'ignore' })
    probe.on('error', () => resolve(false))
    probe.on('close', (code) => resolve(code === 0))
  })
}

export type PdfConverter = 'pdftocairo' | 'mutool'

// poppler (pdftocairo) by default, mupdf (mutool) as fallback.
export async function findPdfConverter(): Promise<PdfConverter | null> {
  if (await hasBinary('pdftocairo')) return 'pdftocairo'
  if (await hasBinary('mutool')) return 'mutool'
  return null
}
