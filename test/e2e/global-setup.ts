import { resolve } from 'node:path'
import { makeBundle, makeSingleFile } from './make-bundle.js'

export default async function globalSetup() {
  await makeBundle('test-output/bundle')
  await makeSingleFile(resolve('test-output/single.html'))
  // A spread + rtl variant, exercised over file:// so it stays isolated from the
  // single-mode bundle the other specs rely on.
  await makeSingleFile(resolve('test-output/single-spread.html'), { spread: true, rtl: true })
}
