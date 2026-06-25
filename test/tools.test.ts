import { test, expect } from 'vitest'
import { hasBinary } from '../src/tools.js'

test('hasBinary is true for node', async () => {
  expect(await hasBinary('node')).toBe(true)
})

test('hasBinary is false for a non-existent binary', async () => {
  expect(await hasBinary('binaire-qui-nexiste-pas-12345')).toBe(false)
})
