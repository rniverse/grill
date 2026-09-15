import type { ID } from '@/types/topic.types'

export interface LocalTargetRef {
  topic: { name: string; version: string } // snapshot at creation time
  target: { kind: 'question' | 'reference'; id: ID }
}

export interface TextSelection {
  text: string
  range: { start: number; end: number } // character offsets into the container's textContent
}

export interface PendingQuestion extends LocalTargetRef {
  id: ID
  selection: TextSelection
  ask: string
  createdAt: string // ISO
}

// topic/target are both present for a note made about a question or
// reference, and both absent for a standalone note made from the Notes
// page directly — never one without the other.
export interface PersonalNote {
  id: ID
  topic?: LocalTargetRef['topic']
  target?: LocalTargetRef['target']
  text: string // markdown
  createdAt: string // ISO
  updatedAt: string // ISO
}

export function personalNoteHasTarget(
  note: PersonalNote,
): note is PersonalNote & Required<Pick<PersonalNote, 'topic' | 'target'>> {
  return note.topic !== undefined && note.target !== undefined
}

export interface Bookmark extends LocalTargetRef {
  id: ID
  createdAt: string // ISO
}
