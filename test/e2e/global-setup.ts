import { resolve } from 'node:path'
import { makeBundle, makeSingleFile } from './make-bundle.js'

export default async function globalSetup() {
  await makeBundle('test-output/bundle')
  await makeSingleFile(resolve('test-output/single.html'))
}
