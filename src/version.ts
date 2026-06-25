import { createRequire } from 'node:module'

// Single source of truth: read the version from package.json (shipped in the
// published tarball) so `--version` always matches the package version.
const pkg = createRequire(import.meta.url)('../package.json') as { version: string }
export const VERSION = pkg.version
