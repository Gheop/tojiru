#!/usr/bin/env node
import { mkdtemp, rm, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, basename } from 'node:path'
import { existsSync } from 'node:fs'
import { Command } from 'commander'
import { VERSION } from './version.js'
import { detectKind } from './extractors/detect.js'
import { pdfExtractor } from './extractors/pdf.js'
import { processPages } from './pages.js'
import { buildManifest } from './manifest.js'
import { writeFolder } from './output/folder.js'
import type { Extractor } from './extractors/types.js'

const EXTRACTORS: Extractor[] = [pdfExtractor]

async function convert(input: string, opts: { out?: string; title?: string; force?: boolean }) {
  if (!existsSync(input)) throw new Error(`Fichier introuvable : ${input}`)

  const kind = await detectKind(input)
  const extractor = EXTRACTORS.find((e) => e.name === kind)
  if (!extractor) {
    throw new Error(kind ? `Format pas encore supporté : ${kind}` : 'Format non reconnu')
  }

  const outDir = opts.out ?? basename(input).replace(/\.[^.]+$/, '')
  if (existsSync(outDir) && (await readdir(outDir)).length > 0 && !opts.force) {
    throw new Error(`Le dossier ${outDir} n'est pas vide. Utilise --force pour écraser.`)
  }

  const work = await mkdtemp(join(tmpdir(), 'tojiru-'))
  try {
    const doc = await extractor.extract(input, work)
    if (opts.title) doc.title = opts.title
    if (doc.pages.length === 0) throw new Error('Aucune page extraite.')
    const pages = await processPages(doc, outDir)
    await writeFolder(buildManifest(doc.title, doc.kind, pages), outDir)
    console.log(`✓ ${doc.pages.length} pages → ${outDir}/`)
  } finally {
    await rm(work, { recursive: true, force: true })
  }
}

const program = new Command()
program
  .name('tojiru')
  .description('Transforme un document à pages fixes en lecteur web statique')
  .version(VERSION)
  .argument('<input>', 'fichier source (PDF)')
  .option('-o, --out <dir>', 'dossier de sortie')
  .option('-t, --title <titre>', 'titre du document')
  .option('-f, --force', 'écraser un dossier non vide')
  .action(async (input, opts) => {
    try {
      await convert(input, opts)
    } catch (e) {
      console.error(`Erreur : ${(e as Error).message}`)
      process.exit(1)
    }
  })

program.parseAsync(process.argv)
