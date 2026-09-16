import { beforeEach, describe, expect, test } from 'bun:test'
import { storage } from './storage'
import type { LocalTargetRef } from '@/types/personal.types'

const topic: LocalTargetRef['topic'] = { name: 'nodejs', version: '1.0.0' }
const questionTarget: LocalTargetRef['target'] = { kind: 'question', id: 'q1' }
const referenceTarget: LocalTargetRef['target'] = { kind: 'reference', id: 'r1' }

beforeEach(() => {
  localStorage.clear()
})

describe('pending questions', () => {
  test('starts empty', () => {
    expect(storage.list.personal.questions()).toEqual([])
  })

  test('saves a pending question with a generated id and createdAt', () => {
    const saved = storage.create.question({
      topic,
      target: questionTarget,
      selection: { text: 'Event Loop', range: { start: 4, end: 14 } },
      ask: 'How does this interact with microtasks?',
    })

    expect(saved.id).toHaveLength(26)
    expect(saved.createdAt).toBeTruthy()
    expect(storage.list.personal.questions()).toEqual([saved])
  })

  test('deletes a pending question by id', () => {
    const saved = storage.create.question({
      topic,
      target: questionTarget,
      selection: { text: 'Event Loop', range: { start: 4, end: 14 } },
      ask: 'Why?',
    })

    storage.delete.question(saved.id)

    expect(storage.list.personal.questions()).toEqual([])
  })
})

describe('personal notes', () => {
  test('has no note for a target that was never saved', () => {
    expect(storage.get.note(questionTarget)).toBeUndefined()
  })

  test('creates a note with a target', () => {
    const note = storage.create.note('first draft', { target: questionTarget, topic })

    expect(note.id).toHaveLength(26)
    expect(note.text).toBe('first draft')
    expect(note.createdAt).toBe(note.updatedAt)
    expect(storage.get.note(questionTarget)).toEqual(note)
  })

  test('creates a standalone note with no target', () => {
    const note = storage.create.note('a freeform note')

    expect(note.topic).toBeUndefined()
    expect(note.target).toBeUndefined()
    expect(storage.list.personal.notes()).toEqual([note])
  })

  test('saving twice for the same target creates two separate notes — save always creates', () => {
    storage.create.note('first draft', { target: questionTarget, topic })
    storage.create.note('second draft', { target: questionTarget, topic })

    expect(storage.list.personal.notes()).toHaveLength(2)
  })

  test('updatePersonalNote updates text and updatedAt, keeps id and createdAt', () => {
    const note = storage.create.note('first draft', { target: questionTarget, topic })

    const updated = storage.update.note(note.id, 'revised draft')

    expect(updated?.id).toBe(note.id)
    expect(updated?.createdAt).toBe(note.createdAt)
    expect(updated?.text).toBe('revised draft')
    expect(storage.list.personal.notes()).toHaveLength(1)
  })

  test('updatePersonalNote returns undefined for an id that does not exist', () => {
    expect(storage.update.note('nonexistent', 'text')).toBeUndefined()
  })

  test('keeps notes for different targets independent', () => {
    storage.create.note('about the question', { target: questionTarget, topic })
    storage.create.note('about the reference', { target: referenceTarget, topic })

    expect(storage.list.personal.notes()).toHaveLength(2)
    expect(storage.get.note(questionTarget)?.text).toBe('about the question')
    expect(storage.get.note(referenceTarget)?.text).toBe('about the reference')
  })

  test('deletes a note by id', () => {
    const note = storage.create.note('temporary', { target: questionTarget, topic })

    storage.delete.note(note.id)

    expect(storage.list.personal.notes()).toEqual([])
  })
})

describe('bookmarks', () => {
  test('is not bookmarked initially', () => {
    expect(storage.check.bookmarked(questionTarget)).toBe(false)
  })

  test('toggling adds a bookmark', () => {
    storage.toggle.bookmark(questionTarget, topic)

    expect(storage.check.bookmarked(questionTarget)).toBe(true)
    expect(storage.list.personal.bookmarks()).toHaveLength(1)
  })

  test('toggling again removes the bookmark', () => {
    storage.toggle.bookmark(questionTarget, topic)
    storage.toggle.bookmark(questionTarget, topic)

    expect(storage.check.bookmarked(questionTarget)).toBe(false)
    expect(storage.list.personal.bookmarks()).toEqual([])
  })

  test('bookmarks for different targets are independent', () => {
    storage.toggle.bookmark(questionTarget, topic)
    storage.toggle.bookmark(referenceTarget, topic)

    expect(storage.check.bookmarked(questionTarget)).toBe(true)
    expect(storage.check.bookmarked(referenceTarget)).toBe(true)
    expect(storage.list.personal.bookmarks()).toHaveLength(2)
  })
})

describe('export/import', () => {
  test('exports all three collections as one JSON string', () => {
    storage.create.question({
      topic,
      target: questionTarget,
      selection: { text: 'Event Loop', range: { start: 4, end: 14 } },
      ask: 'Why?',
    })
    storage.create.note('a note', { target: questionTarget, topic })
    storage.toggle.bookmark(referenceTarget, topic)

    const exported = JSON.parse(storage.personalLayer.export())

    expect(exported.pendingQuestions).toHaveLength(1)
    expect(exported.personalNotes).toHaveLength(1)
    expect(exported.bookmarks).toHaveLength(1)
  })

  test('import replaces existing data with the parsed snapshot', () => {
    storage.toggle.bookmark(questionTarget, topic) // data that should be wiped out by the import

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

    storage.personalLayer.import(JSON.stringify(snapshot))

    expect(storage.list.personal.bookmarks()).toEqual([])
    expect(storage.list.personal.notes()).toEqual(snapshot.personalNotes)
  })

  test('throws on invalid JSON', () => {
    expect(() => storage.personalLayer.import('not json')).toThrow()
  })

  test('throws when the parsed shape is missing expected arrays', () => {
    expect(() => storage.personalLayer.import(JSON.stringify({ pendingQuestions: [] }))).toThrow()
  })

  test('round-trips a well-formed export through import', () => {
    storage.create.question({
      topic,
      target: questionTarget,
      selection: { text: 'Event Loop', range: { start: 4, end: 14 } },
      ask: 'Why?',
    })
    storage.create.note('a note', { target: questionTarget, topic })
    storage.toggle.bookmark(referenceTarget, topic)

    const exported = storage.personalLayer.export()
    localStorage.clear()
    storage.personalLayer.import(exported)

    expect(JSON.parse(storage.personalLayer.export())).toEqual(JSON.parse(exported))
  })

  test('rejects an import where one pending question element is malformed, without writing anything', () => {
    storage.toggle.bookmark(questionTarget, topic) // pre-existing data that must survive the rejected import

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

    expect(() => storage.personalLayer.import(JSON.stringify(snapshot))).toThrow()
    expect(storage.list.personal.questions()).toEqual([])
    expect(storage.check.bookmarked(questionTarget)).toBe(true)
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

    expect(() => storage.personalLayer.import(JSON.stringify(snapshot))).toThrow()
    expect(storage.list.personal.notes()).toEqual([])
  })

  test('accepts a standalone note (no topic, no target) on import', () => {
    const snapshot = {
      pendingQuestions: [],
      personalNotes: [
        { id: 'note-1', text: 'a freeform note', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
      ],
      bookmarks: [],
    }

    storage.personalLayer.import(JSON.stringify(snapshot))

    expect(storage.list.personal.notes()).toEqual(snapshot.personalNotes)
  })

  test('rejects an import where a personal note has a target but no topic, without writing anything', () => {
    const snapshot = {
      pendingQuestions: [],
      personalNotes: [
        {
          id: 'note-1',
          target: referenceTarget,
          // topic missing — target without topic is malformed
          text: 'restored note',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      bookmarks: [],
    }

    expect(() => storage.personalLayer.import(JSON.stringify(snapshot))).toThrow()
    expect(storage.list.personal.notes()).toEqual([])
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

    expect(() => storage.personalLayer.import(JSON.stringify(snapshot))).toThrow()
    expect(storage.list.personal.bookmarks()).toEqual([])
  })
})

describe('corrupt storage', () => {
  test('falls back to an empty array when a key holds corrupt JSON', () => {
    localStorage.setItem('grill-prep:pending-questions', '{not valid json')

    expect(storage.list.personal.questions()).toEqual([])
  })

  test('falls back to an empty array when a key holds a non-array value', () => {
    localStorage.setItem('grill-prep:bookmarks', JSON.stringify({ oops: true }))

    expect(storage.list.personal.bookmarks()).toEqual([])
  })
})

describe('content sources', () => {
  test('seeds CONTENT_SOURCES into storage on first read', () => {
    const sources = storage.list.sources()

    expect(sources).toHaveLength(2)
    expect(sources[0].id).toBe('angular')
    expect(sources[1].id).toBe('nodejs')
  })

  test('does not reseed over a value already written', () => {
    storage.list.sources() // seeds
    localStorage.setItem('grill-prep:content-sources', JSON.stringify([]))

    expect(storage.list.sources()).toEqual([])
  })

  test('updateSourceValidation writes validation onto the matching row', () => {
    storage.list.sources() // seeds

    storage.update.sourceValidation('angular', 'topic', { status: 'success', at: '2026-09-16T00:00:00.000Z' })

    const updated = storage.list.sources().find((source) => source.id === 'angular')
    expect(updated?.validation?.topic).toEqual({ status: 'success', at: '2026-09-16T00:00:00.000Z' })
  })

  test('updateSourceValidation on an unknown id is a no-op', () => {
    storage.list.sources() // seeds

    storage.update.sourceValidation('does-not-exist', 'topic', { status: 'success', at: '2026-09-16T00:00:00.000Z' })

    expect(storage.list.sources().every((source) => source.validation === undefined)).toBe(true)
  })
})
