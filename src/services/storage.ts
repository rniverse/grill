import { generateId } from '@/utils/id'
import type { Bookmark, LocalTargetRef, PendingQuestion, PersonalNote, TextSelection } from '@/types/personal.types'
import type { ID } from '@/types/topic.types'
import { CONTENT_SOURCES, type ContentSourceConfig, type SourceValidation } from '@/config/content-sources'

const KEY = {
  pendingQuestions: 'grill-prep:pending-questions',
  personalNotes: 'grill-prep:personal-notes',
  bookmarks: 'grill-prep:bookmarks',
  contentSources: 'grill-prep:content-sources',
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

function listPendingQuestions(): PendingQuestion[] {
  return readArray<PendingQuestion>(KEY.pendingQuestions)
}

function savePendingQuestion(input: Omit<PendingQuestion, 'id' | 'createdAt'>): PendingQuestion {
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

function deletePendingQuestion(id: ID): void {
  const remaining = listPendingQuestions().filter((question) => question.id !== id)
  writeArray(KEY.pendingQuestions, remaining)
}

function listPersonalNotes(): PersonalNote[] {
  return readArray<PersonalNote>(KEY.personalNotes)
}

function getPersonalNote(target: LocalTargetRef['target']): PersonalNote | undefined {
  return listPersonalNotes().find((note) => note.target && targetsMatch(note.target, target))
}

// Always creates a new note. ref is omitted for a standalone note made from
// the Notes page directly, with no question or reference behind it.
function savePersonalNote(text: string, ref?: LocalTargetRef): PersonalNote {
  const now = new Date().toISOString()
  const note: PersonalNote = {
    id: generateId(),
    topic: ref?.topic,
    target: ref?.target,
    text,
    createdAt: now,
    updatedAt: now,
  }
  const notes = listPersonalNotes()
  notes.push(note)
  writeArray(KEY.personalNotes, notes)
  return note
}

function updatePersonalNote(id: ID, text: string): PersonalNote | undefined {
  const notes = listPersonalNotes()
  const index = notes.findIndex((note) => note.id === id)
  if (index === -1) return undefined

  const existing = notes[index]
  const updated: PersonalNote = { ...existing, text, updatedAt: new Date().toISOString() }
  notes[index] = updated
  writeArray(KEY.personalNotes, notes)
  return updated
}

function deletePersonalNote(id: ID): void {
  const remaining = listPersonalNotes().filter((note) => note.id !== id)
  writeArray(KEY.personalNotes, remaining)
}

function listBookmarks(): Bookmark[] {
  return readArray<Bookmark>(KEY.bookmarks)
}

function isBookmarked(target: LocalTargetRef['target']): boolean {
  return listBookmarks().some((bookmark) => targetsMatch(bookmark.target, target))
}

function toggleBookmark(target: LocalTargetRef['target'], topic: LocalTargetRef['topic']): void {
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

// Seeds CONTENT_SOURCES into storage on first read (key absent, not just
// empty — an empty array the user emptied out on purpose must stay empty).
function listContentSources(): ContentSourceConfig[] {
  if (localStorage.getItem(KEY.contentSources) === null) {
    writeArray(KEY.contentSources, CONTENT_SOURCES)
  }
  return readArray<ContentSourceConfig>(KEY.contentSources)
}

function createContentSource(row: {
  id: string
  name: string
  source: { topic?: string; references?: string }
}): ContentSourceConfig {
  const sources = listContentSources()
  if (sources.some((existing) => existing.id === row.id)) {
    throw new Error(`createContentSource: id "${row.id}" already exists`)
  }

  const source: ContentSourceConfig = { id: row.id, name: row.name, source: row.source }
  sources.push(source)
  writeArray(KEY.contentSources, sources)
  return source
}

function updateContentSource(
  id: string,
  patch: { name?: string; source?: { topic?: string; references?: string } },
): ContentSourceConfig | undefined {
  const sources = listContentSources()
  const index = sources.findIndex((source) => source.id === id)
  if (index === -1) return undefined

  const existing = sources[index]
  const updated: ContentSourceConfig = {
    ...existing,
    name: patch.name ?? existing.name,
    source: patch.source ?? existing.source,
  }
  sources[index] = updated
  writeArray(KEY.contentSources, sources)
  return updated
}

function deleteContentSource(id: string): void {
  const remaining = listContentSources().filter((source) => source.id !== id)
  writeArray(KEY.contentSources, remaining)
}

function updateSourceValidation(id: string, kind: 'topic' | 'references', result: SourceValidation): void {
  const sources = listContentSources()
  const index = sources.findIndex((source) => source.id === id)
  if (index === -1) return

  const existing = sources[index]
  sources[index] = { ...existing, validation: { ...existing.validation, [kind]: result } }
  writeArray(KEY.contentSources, sources)
}

function exportPersonalLayer(): string {
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
  if (!isRecord(value)) return false
  if (typeof value.id !== 'string') return false
  if (typeof value.createdAt !== 'string') return false
  if (typeof value.updatedAt !== 'string') return false
  if (typeof value.text !== 'string') return false

  // topic/target are both present or both absent — never one without the other.
  if (value.topic === undefined && value.target === undefined) return true
  return isLocalTargetRefShape(value)
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

function importPersonalLayer(json: string): void {
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

export const storage = {
  list: {
    personal: {
      bookmarks: listBookmarks,
      notes: listPersonalNotes,
      questions: listPendingQuestions,
    },
    sources: listContentSources,
  },
  get: {
    note: getPersonalNote,
  },
  create: {
    note: savePersonalNote,
    question: savePendingQuestion,
    source: createContentSource,
  },
  update: {
    note: updatePersonalNote,
    sourceValidation: updateSourceValidation,
    source: updateContentSource,
  },
  delete: {
    note: deletePersonalNote,
    question: deletePendingQuestion,
    source: deleteContentSource,
  },
  toggle: {
    bookmark: toggleBookmark,
  },
  check: {
    bookmarked: isBookmarked,
  },
  personalLayer: {
    export: exportPersonalLayer,
    import: importPersonalLayer,
  },
}
