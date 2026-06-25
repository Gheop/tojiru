import { createServer } from 'node:http'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { join, resolve as resolvePath, extname } from 'node:path'

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.svgz': 'application/octet-stream',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
}

export async function serve(dir: string, port = 8000): Promise<{ url: string; close: () => void }> {
  const absDir = resolvePath(dir)

  function handler(req: IncomingMessage, res: ServerResponse): void {
    const urlPath = req.url?.split('?')[0] ?? '/'
    const safePath = urlPath === '/' ? '/index.html' : urlPath

    let decoded: string
    try {
      decoded = decodeURIComponent(safePath)
    } catch {
      res.writeHead(400)
      res.end()
      return
    }

    const abs = resolvePath(join(absDir, decoded))

    // Path traversal check: the resolved path must be inside absDir
    if (!abs.startsWith(absDir + '/')) {
      res.writeHead(404)
      res.end()
      return
    }

    if (!existsSync(abs) || statSync(abs).isDirectory()) {
      res.writeHead(404)
      res.end()
      return
    }

    const ext = extname(abs).toLowerCase()
    const ct = CONTENT_TYPES[ext] ?? 'application/octet-stream'
    res.writeHead(200, { 'Content-Type': ct })
    createReadStream(abs).pipe(res)
  }

  return new Promise((resolveFn, rejectFn) => {
    let currentPort = port

    function tryListen(): void {
      const server = createServer(handler)
      server.listen(currentPort, '127.0.0.1')
      server.on('listening', () => {
        const url = `http://localhost:${currentPort}`
        resolveFn({ url, close: () => server.close() })
      })
      server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE' && currentPort < 8020) {
          currentPort++
          server.removeAllListeners()
          tryListen()
        } else {
          rejectFn(err)
        }
      })
    }

    tryListen()
  })
}
