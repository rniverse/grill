import { generateId } from '@/utils/id'
import type { Bookmark, LocalTargetRef, PendingQuestion, PersonalNote, TextSelection } from '@/types/personal.types'
import type { ID } from '@/types/topic.types'

const KEY = {
  pendingQuestions: 'grill-prep:pending-questions',
  personalNotes: 'grill-prep:personal-notes',
  bookmarks: 'grill-prep:bookmarks',
} as const

function readArray<T>(key: string): T[] {
  const raw = localStorage.getItem(key)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeArray<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items))
}

function targetsMatch(a: LocalTargetRef['target'], b: LocalTargetRef['target']): boolean {
  return a.kind === b.kind && a.id === b.id
}

export function listPendingQuestions(): PendingQuestion[] {
  return readArray<PendingQuestion>(KEY.pendingQuestions)
}

export function savePendingQuestion(
  input: Omit<PendingQuestion, 'id' | 'createdAt'>,
): PendingQuestion {
  const question: PendingQuestion = {
    ...input,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }
  const questions = listPendingQuestions()
  questions.push(question)
  writeArray(KEY.pendingQuestions, questions)
  return question
}

export function deletePendingQuestion(id: ID): void {
  const remaining = listPendingQuestions().filter((question) => question.id !== id)
  writeArray(KEY.pendingQuestions, remaining)
}

export function listPersonalNotes(): PersonalNote[] {
  return readArray<PersonalNote>(KEY.personalNotes)
}

export function getPersonalNote(target: LocalTargetRef['target']): PersonalNote | undefined {
  return listPersonalNotes().find((note) => targetsMatch(note.target, target))
}

export function savePersonalNote(
  target: LocalTargetRef['target'],
  topic: LocalTargetRef['topic'],
  text: string,
): PersonalNote {
  const notes = listPersonalNotes()
  const existingIndex = notes.findIndex((note) => targetsMatch(note.target, target))
  const now = new Date().toISOString()

  if (existingIndex === -1) {
    const note: PersonalNote = { id: generateId(), topic, target, text, createdAt: now, updatedAt: now }
    notes.push(note)
    writeArray(KEY.personalNotes, notes)
    return note
  }

  const existing = notes[existingIndex]!
  const updated: PersonalNote = { ...existing, text, updatedAt: now }
  notes[existingIndex] = updated
  writeArray(KEY.personalNotes, notes)
  return updated
}

export function deletePersonalNote(id: ID): void {
  const remaining = listPersonalNotes().filter((note) => note.id !== id)
  writeArray(KEY.personalNotes, remaining)
}

export function listBookmarks(): Bookmark[] {
  return readArray<Bookmark>(KEY.bookmarks)
}

export function isBookmarked(target: LocalTargetRef['target']): boolean {
  return listBookmarks().some((bookmark) => targetsMatch(bookmark.target, target))
}

export function toggleBookmark(target: LocalTargetRef['target'], topic: LocalTargetRef['topic']): void {
  const bookmarks = listBookmarks()
  const existing = bookmarks.find((bookmark) => targetsMatch(bookmark.target, target))

  if (existing) {
    writeArray(
      KEY.bookmarks,
      bookmarks.filter((bookmark) => bookmark.id !== existing.id),
    )
    return
  }

  const bookmark: Bookmark = { id: generateId(), topic, target, createdAt: new Date().toISOString() }
  bookmarks.push(bookmark)
  writeArray(KEY.bookmarks, bookmarks)
}

export function exportPersonalLayer(): string {
  return JSON.stringify({
    pendingQuestions: listPendingQuestions(),
    personalNotes: listPersonalNotes(),
    bookmarks: listBookmarks(),
  })
}

interface PersonalLayerExport {
  pendingQuestions: PendingQuestion[]
  personalNotes: PersonalNote[]
  bookmarks: Bookmark[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isLocalTargetRefShape(value: unknown): value is LocalTargetRef {
  if (!isRecord(value)) return false

  const topic = value.topic
  if (!isRecord(topic) || typeof topic.name !== 'string' || typeof topic.version !== 'string') return false

  const target = value.target
  if (!isRecord(target)) return false
  if (target.kind !== 'question' && target.kind !== 'reference') return false
  if (typeof target.id !== 'string') return false

  return true
}

function isTextSelectionShape(value: unknown): value is TextSelection {
  if (!isRecord(value)) return false
  if (typeof value.text !== 'string') return false

  const range = value.range
  if (!isRecord(range)) return false
  return typeof range.start === 'number' && typeof range.end === 'number'
}

function isPendingQuestionShape(value: unknown): value is PendingQuestion {
  if (!isLocalTargetRefShape(value)) return false
  const candidate = value as unknown as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.ask === 'string' &&
    isTextSelectionShape(candidate.selection)
  )
}

function isPersonalNoteShape(value: unknown): value is PersonalNote {
  if (!isLocalTargetRefShape(value)) return false
  const candidate = value as unknown as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string' &&
    typeof candidate.text === 'string'
  )
}

function isBookmarkShape(value: unknown): value is Bookmark {
  if (!isLocalTargetRefShape(value)) return false
  const candidate = value as unknown as Record<string, unknown>
  return typeof candidate.id === 'string' && typeof candidate.createdAt === 'string'
}

function isPersonalLayerExport(value: unknown): value is PersonalLayerExport {
  if (!isRecord(value)) return false

  return (
    Array.isArray(value.pendingQuestions) &&
    value.pendingQuestions.every(isPendingQuestionShape) &&
    Array.isArray(value.personalNotes) &&
    value.personalNotes.every(isPersonalNoteShape) &&
    Array.isArray(value.bookmarks) &&
    value.bookmarks.every(isBookmarkShape)
  )
}

export function importPersonalLayer(json: string): void {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('importPersonalLayer: input is not valid JSON')
  }

  if (!isPersonalLayerExport(parsed)) {
    throw new Error(
      'importPersonalLayer: expected an object with pendingQuestions, personalNotes, and bookmarks arrays',
    )
  }

  writeArray(KEY.pendingQuestions, parsed.pendingQuestions)
  writeArray(KEY.personalNotes, parsed.personalNotes)
  writeArray(KEY.bookmarks, parsed.bookmarks)
}
