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
  .description('Turn a fixed-page document into a static web reader')
  .version(VERSION)
  .argument('<input>', 'source file (PDF, CBZ, CB7, CBR, DjVu)')
  .option('-o, --out <dir>', 'output folder')
  .option('-t, --title <title>', 'document title')
  .option('-f, --force', 'overwrite a non-empty output folder')
  .action(async (input, opts) => {
    try {
      if (!existsSync(input)) throw new Error(`File not found: ${input}`)

      const outDir = opts.out ?? basename(input).replace(/\.[^.]+$/, '')
      if (existsSync(outDir) && (await readdir(outDir)).length > 0 && !opts.force) {
        throw new Error(`Folder ${outDir} is not empty. Use --force to overwrite.`)
      }

      const r = await convert(input, { outDir, title: opts.title })
      console.log(`✓ ${r.pageCount} pages → ${r.outDir}/`)
    } catch (e) {
      console.error(`Error: ${(e as Error).message}`)
      process.exit(1)
    }
  })

program.parseAsync(process.argv)
