import { describe, expect, test } from 'bun:test'
import { locateSelection } from './highlight'
import type { TextSelection } from '@/types/personal.types'

describe('locateSelection', () => {
  test('returns the stored range unchanged when it still matches', () => {
    const containerText = 'The Event Loop hands CPU work to libuv.'
    const selection: TextSelection = { text: 'Event Loop', range: { start: 4, end: 14 } }
    expect(locateSelection(containerText, selection)).toEqual({ start: 4, end: 14 })
  })

  test('re-locates the text when the stored range has shifted', () => {
    const containerText = 'Now with a prefix. The Event Loop hands CPU work to libuv.'
    const selection: TextSelection = { text: 'Event Loop', range: { start: 4, end: 14 } }
    expect(locateSelection(containerText, selection)).toEqual({ start: 23, end: 33 })
  })

  test('returns not-found when the text no longer exists', () => {
    const containerText = 'Completely different content now.'
    const selection: TextSelection = { text: 'Event Loop', range: { start: 4, end: 14 } }
    expect(locateSelection(containerText, selection)).toBe('not-found')
  })
})
