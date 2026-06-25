#!/usr/bin/env node
import { readdir } from 'node:fs/promises'
import { basename } from 'node:path'
import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { Command } from 'commander'
import { VERSION } from './version.js'
import { convert } from './convert.js'
import { serve } from './serve.js'

function openBrowser(url: string): void {
  const cmd = process.platform === 'darwin' ? 'open' : 'xdg-open'
  try { spawn(cmd, [url], { detached: true, stdio: 'ignore' }).unref() } catch { /* best-effort */ }
}

const program = new Command()
program
  .name('tojiru')
  .description('Turn a fixed-page document into a static web reader')
  .version(VERSION)

// Default convert command — runs when no subcommand matches
program
  .command('convert <input>', { isDefault: true })
  .description('Convert a document to a static web reader')
  .option('-o, --out <dir>', 'output folder')
  .option('-t, --title <title>', 'document title')
  .option('-f, --force', 'overwrite a non-empty output folder')
  .option('--serve', 'start a preview server after converting')
  .action(async (input: string, opts: { out?: string; title?: string; force?: boolean; serve?: boolean }) => {
    try {
      if (!existsSync(input)) throw new Error(`File not found: ${input}`)

      const outDir = opts.out ?? basename(input).replace(/\.[^.]+$/, '')
      if (existsSync(outDir) && (await readdir(outDir)).length > 0 && !opts.force) {
        throw new Error(`Folder ${outDir} is not empty. Use --force to overwrite.`)
      }

      const isTTY = process.stderr.isTTY === true
      const onProgress = isTTY
        ? (done: number, total: number, label: string) => {
            process.stderr.write(`\r${label} ${done}/${total}`)
          }
        : undefined

      const r = await convert(input, { outDir, title: opts.title, onProgress })

      // Clear progress line before success message
      if (isTTY) process.stderr.write('\x1b[2K\r')

      console.log(`✓ ${r.pageCount} pages → ${r.outDir}/`)

      if (opts.serve) {
        const server = await serve(outDir)
        process.stderr.write(`Serving ${outDir} at ${server.url}\n`)
        openBrowser(server.url)
        // Keep running — http server holds the event loop open
      } else {
        process.stderr.write(`  Preview:  tojiru serve ${outDir}\n`)
      }
    } catch (e) {
      console.error(`Error: ${(e as Error).message}`)
      process.exit(1)
    }
  })

// Serve subcommand
program
  .command('serve <dir>')
  .description('Serve a tojiru bundle for browser preview')
  .option('-p, --port <n>', 'port to listen on', '8000')
  .action(async (dir: string, opts: { port?: string }) => {
    try {
      if (!existsSync(dir)) throw new Error(`Directory not found: ${dir}`)
      const port = opts.port ? parseInt(opts.port, 10) : 8000
      const server = await serve(dir, port)
      process.stderr.write(`Serving ${dir} at ${server.url}\n`)
      openBrowser(server.url)
      // Keep running — Ctrl+C exits
    } catch (e) {
      console.error(`Error: ${(e as Error).message}`)
      process.exit(1)
    }
  })

program.parseAsync(process.argv)
