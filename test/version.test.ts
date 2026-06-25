// test/version.test.ts
import { test, expect } from 'vitest'
import { VERSION } from '../src/version.js'

test('VERSION est une chaîne semver non vide', () => {
  expect(typeof VERSION).toBe('string')
  expect(VERSION).toMatch(/^\d+\.\d+\.\d+/)
})
