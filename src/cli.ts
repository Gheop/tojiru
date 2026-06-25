#!/usr/bin/env node
import { readdir } from 'node:fs/promises'
import { basename } from 'node:path'
import { existsSync } from 'node:fs'
import { Command } from 'commander'
import { VERSION } from './version.js'
import { convert } from './convert.js'

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
      if (!existsSync(input)) throw new Error(`Fichier introuvable : ${input}`)

      const outDir = opts.out ?? basename(input).replace(/\.[^.]+$/, '')
      if (existsSync(outDir) && (await readdir(outDir)).length > 0 && !opts.force) {
        throw new Error(`Le dossier ${outDir} n'est pas vide. Utilise --force pour écraser.`)
      }

      const r = await convert(input, { outDir, title: opts.title })
      console.log(`✓ ${r.pageCount} pages → ${r.outDir}/`)
    } catch (e) {
      console.error(`Erreur : ${(e as Error).message}`)
      process.exit(1)
    }
  })

program.parseAsync(process.argv)
