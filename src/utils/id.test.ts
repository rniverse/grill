import { describe, expect, test } from 'bun:test'
import { generateId } from './id'

describe('generateId', () => {
  test('returns a 26-character ULID', () => {
    const id = generateId()
    expect(id).toHaveLength(26)
  })

  test('returns a different id on each call', () => {
    const first = generateId()
    const second = generateId()
    expect(first).not.toBe(second)
  })
})
