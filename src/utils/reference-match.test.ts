import { describe, expect, test } from 'bun:test'
import { findReferenceMatches } from './reference-match'
import type { Reference } from '@/types/topic.types'

function ref(term: string): Reference {
  return { id: `id-${term}`, term, text: `definition of ${term}` }
}

describe('findReferenceMatches', () => {
  test('finds a single case-insensitive match', () => {
    const matches = findReferenceMatches('The Buffer type wraps raw memory.', [ref('buffer')])
    expect(matches).toEqual([{ start: 4, end: 10, reference: ref('buffer') }])
  })

  test('does not match inside a larger word', () => {
    const matches = findReferenceMatches('Buffering is not the same as a Buffer.', [ref('Buffer')])
    expect(matches).toHaveLength(1)
    expect(matches[0]!.start).toBe(31)
  })

  test('prefers the longer overlapping term', () => {
    const matches = findReferenceMatches('Reach for Worker Threads here.', [ref('Worker'), ref('Worker Threads')])
    expect(matches).toHaveLength(1)
    expect(matches[0]!.reference.term).toBe('Worker Threads')
  })

  test('finds multiple distinct terms in order', () => {
    const text = 'The Event Loop hands CPU work to libuv.'
    const matches = findReferenceMatches(text, [ref('Event Loop'), ref('libuv')])
    expect(matches.map((m) => m.reference.term)).toEqual(['Event Loop', 'libuv'])
  })

  test('returns nothing when no reference is cited', () => {
    expect(findReferenceMatches('Plain text with no terms.', [])).toEqual([])
  })
})
