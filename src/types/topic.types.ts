import type { AnswerType } from './answer-type.enum'

export type ID = string // ULID

export interface FileMeta {
  version: string // bumped whenever this file's content changes
  cutOffTime: string // ISO — latest locally-asked question already folded into this version
  updatedAt: string // ISO — last edit to this file
}

export interface Topic {
  id: string // slug, e.g. "angular"
  name: string
}

export interface AnswerContent {
  type: AnswerType
  value: string // markdown when type is 'md-text', plain text when 'text'; may include mermaid fences
}

export interface Question {
  id: ID
  question: string
  answer: AnswerContent
  references: ID[] // Reference ids cited in the answer
  related: ID[] // other Question ids worth reading alongside this one
  notes?: string // single shipped note, markdown
  tags?: string[]
}

export interface Reference {
  id: ID // what Question.references points to
  term: string // display label + auto-highlight match string in answer text
  text: string // markdown — the flashcard content shown on click
  notes?: string
}
