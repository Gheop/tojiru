import { spawn } from 'node:child_process'

export function run(cmd: string, args: string[]): Promise<{ stdout: string; code: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args)
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => (stdout += d))
    child.stderr.on('data', (d) => (stderr += d))
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve({ stdout, code })
      else reject(new Error(`${cmd} a échoué (code ${code}) : ${stderr.trim()}`))
    })
  })
}
