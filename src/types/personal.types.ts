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

export interface PersonalNote extends LocalTargetRef {
  id: ID
  text: string // markdown
  createdAt: string // ISO
  updatedAt: string // ISO
}

export interface Bookmark extends LocalTargetRef {
  id: ID
  createdAt: string // ISO
}
