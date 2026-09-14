import { beforeEach, describe, expect, test } from 'bun:test'
import {
  deletePendingQuestion,
  deletePersonalNote,
  exportPersonalLayer,
  getPersonalNote,
  importPersonalLayer,
  isBookmarked,
  listBookmarks,
  listPendingQuestions,
  listPersonalNotes,
  savePendingQuestion,
  savePersonalNote,
  toggleBookmark,
} from './storage'
import type { LocalTargetRef } from '@/types/personal.types'

const topic: LocalTargetRef['topic'] = { name: 'nodejs', version: '1.0.0' }
const questionTarget: LocalTargetRef['target'] = { kind: 'question', id: 'q1' }
const referenceTarget: LocalTargetRef['target'] = { kind: 'reference', id: 'r1' }

beforeEach(() => {
  localStorage.clear()
})

describe('pending questions', () => {
  test('starts empty', () => {
    expect(listPendingQuestions()).toEqual([])
  })

  test('saves a pending question with a generated id and createdAt', () => {
    const saved = savePendingQuestion({
      topic,
      target: questionTarget,
      selection: { text: 'Event Loop', range: { start: 4, end: 14 } },
      ask: 'How does this interact with microtasks?',
    })

    expect(saved.id).toHaveLength(26)
    expect(saved.createdAt).toBeTruthy()
    expect(listPendingQuestions()).toEqual([saved])
  })

  test('deletes a pending question by id', () => {
    const saved = savePendingQuestion({
      topic,
      target: questionTarget,
      selection: { text: 'Event Loop', range: { start: 4, end: 14 } },
      ask: 'Why?',
    })

    deletePendingQuestion(saved.id)

    expect(listPendingQuestions()).toEqual([])
  })
})

describe('personal notes', () => {
  test('has no note for a target that was never saved', () => {
    expect(getPersonalNote(questionTarget)).toBeUndefined()
  })

  test('creates a note on first save', () => {
    const note = savePersonalNote(questionTarget, topic, 'first draft')

    expect(note.id).toHaveLength(26)
    expect(note.text).toBe('first draft')
    expect(note.createdAt).toBe(note.updatedAt)
    expect(getPersonalNote(questionTarget)).toEqual(note)
  })

  test('upserts: a second save for the same target updates text and keeps id/createdAt', () => {
    const first = savePersonalNote(questionTarget, topic, 'first draft')
    const second = savePersonalNote(questionTarget, topic, 'revised draft')

    expect(second.id).toBe(first.id)
    expect(second.createdAt).toBe(first.createdAt)
    expect(second.text).toBe('revised draft')
    expect(listPersonalNotes()).toHaveLength(1)
  })

  test('keeps notes for different targets independent', () => {
    savePersonalNote(questionTarget, topic, 'about the question')
    savePersonalNote(referenceTarget, topic, 'about the reference')

    expect(listPersonalNotes()).toHaveLength(2)
    expect(getPersonalNote(questionTarget)?.text).toBe('about the question')
    expect(getPersonalNote(referenceTarget)?.text).toBe('about the reference')
  })

  test('deletes a note by id', () => {
    const note = savePersonalNote(questionTarget, topic, 'temporary')

    deletePersonalNote(note.id)

    expect(listPersonalNotes()).toEqual([])
  })
})

describe('bookmarks', () => {
  test('is not bookmarked initially', () => {
    expect(isBookmarked(questionTarget)).toBe(false)
  })

  test('toggling adds a bookmark', () => {
    toggleBookmark(questionTarget, topic)

    expect(isBookmarked(questionTarget)).toBe(true)
    expect(listBookmarks()).toHaveLength(1)
  })

  test('toggling again removes the bookmark', () => {
    toggleBookmark(questionTarget, topic)
    toggleBookmark(questionTarget, topic)

    expect(isBookmarked(questionTarget)).toBe(false)
    expect(listBookmarks()).toEqual([])
  })

  test('bookmarks for different targets are independent', () => {
    toggleBookmark(questionTarget, topic)
    toggleBookmark(referenceTarget, topic)

    expect(isBookmarked(questionTarget)).toBe(true)
    expect(isBookmarked(referenceTarget)).toBe(true)
    expect(listBookmarks()).toHaveLength(2)
  })
})

describe('export/import', () => {
  test('exports all three collections as one JSON string', () => {
    savePendingQuestion({
      topic,
      target: questionTarget,
      selection: { text: 'Event Loop', range: { start: 4, end: 14 } },
      ask: 'Why?',
    })
    savePersonalNote(questionTarget, topic, 'a note')
    toggleBookmark(referenceTarget, topic)

    const exported = JSON.parse(exportPersonalLayer())

    expect(exported.pendingQuestions).toHaveLength(1)
    expect(exported.personalNotes).toHaveLength(1)
    expect(exported.bookmarks).toHaveLength(1)
  })

  test('import replaces existing data with the parsed snapshot', () => {
    toggleBookmark(questionTarget, topic) // data that should be wiped out by the import

    const snapshot = {
      pendingQuestions: [],
      personalNotes: [
        {
          id: 'note-1',
          topic,
          target: referenceTarget,
          text: 'restored note',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      bookmarks: [],
    }

    importPersonalLayer(JSON.stringify(snapshot))

    expect(listBookmarks()).toEqual([])
    expect(listPersonalNotes()).toEqual(snapshot.personalNotes)
  })

  test('throws on invalid JSON', () => {
    expect(() => importPersonalLayer('not json')).toThrow()
  })

  test('throws when the parsed shape is missing expected arrays', () => {
    expect(() => importPersonalLayer(JSON.stringify({ pendingQuestions: [] }))).toThrow()
  })

  test('round-trips a well-formed export through import', () => {
    savePendingQuestion({
      topic,
      target: questionTarget,
      selection: { text: 'Event Loop', range: { start: 4, end: 14 } },
      ask: 'Why?',
    })
    savePersonalNote(questionTarget, topic, 'a note')
    toggleBookmark(referenceTarget, topic)

    const exported = exportPersonalLayer()
    localStorage.clear()
    importPersonalLayer(exported)

    expect(JSON.parse(exportPersonalLayer())).toEqual(JSON.parse(exported))
  })

  test('rejects an import where one pending question element is malformed, without writing anything', () => {
    toggleBookmark(questionTarget, topic) // pre-existing data that must survive the rejected import

    const snapshot = {
      pendingQuestions: [
        {
          id: 'pq-1',
          topic,
          target: questionTarget,
          selection: { text: 'Event Loop', range: { start: 4, end: 14 } },
          ask: 'Why?',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'pq-2',
          topic,
          target: questionTarget,
          // missing selection — malformed
          ask: 'Why again?',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      personalNotes: [],
      bookmarks: [],
    }

    expect(() => importPersonalLayer(JSON.stringify(snapshot))).toThrow()
    expect(listPendingQuestions()).toEqual([])
    expect(isBookmarked(questionTarget)).toBe(true)
  })

  test('rejects an import where one personal note element is malformed, without writing anything', () => {
    const snapshot = {
      pendingQuestions: [],
      personalNotes: [
        {
          id: 'note-1',
          topic,
          target: referenceTarget,
          text: 'restored note',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'note-2',
          topic,
          target: referenceTarget,
          text: 123, // not a string — malformed
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      bookmarks: [],
    }

    expect(() => importPersonalLayer(JSON.stringify(snapshot))).toThrow()
    expect(listPersonalNotes()).toEqual([])
  })

  test('rejects an import where one bookmark element is malformed, without writing anything', () => {
    const snapshot = {
      pendingQuestions: [],
      personalNotes: [],
      bookmarks: [
        { id: 'b1', topic, target: questionTarget, createdAt: '2024-01-01T00:00:00.000Z' },
        { id: 'b2', topic, target: { kind: 'not-a-kind', id: 'x' }, createdAt: '2024-01-01T00:00:00.000Z' },
      ],
    }

    expect(() => importPersonalLayer(JSON.stringify(snapshot))).toThrow()
    expect(listBookmarks()).toEqual([])
  })
})

describe('corrupt storage', () => {
  test('falls back to an empty array when a key holds corrupt JSON', () => {
    localStorage.setItem('grill-prep:pending-questions', '{not valid json')

    expect(listPendingQuestions()).toEqual([])
  })

  test('falls back to an empty array when a key holds a non-array value', () => {
    localStorage.setItem('grill-prep:bookmarks', JSON.stringify({ oops: true }))

    expect(listBookmarks()).toEqual([])
  })
})
