import { makeBundle } from './make-bundle.js'

export default async function globalSetup() {
  await makeBundle('test-output/bundle')
}
