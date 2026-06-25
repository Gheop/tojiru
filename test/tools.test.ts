import { test, expect } from 'vitest'
import { hasBinary } from '../src/tools.js'

test('hasBinary est vrai pour node', async () => {
  expect(await hasBinary('node')).toBe(true)
})

test('hasBinary est faux pour un binaire inexistant', async () => {
  expect(await hasBinary('binaire-qui-nexiste-pas-12345')).toBe(false)
})
