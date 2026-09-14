import type { TextType } from './text-type.enum'

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

// A piece of authored content and how it should be resolved before rendering:
// 'simple' — no markdown, no rendering, plain text as-is.
// 'markdown.text' — value is already markdown; render it directly. Only this
//   type is used for now — 'simple'/'markdown.ref' are reserved for later.
// 'markdown.ref' — value is a path to a markdown file to load, then render.
export interface RichText {
  type: TextType
  value: string
}

export interface Question {
  id: ID
  question: string
  answer: RichText // markdown, may include mermaid fences
  references: ID[] // Reference ids cited in the answer
  related: ID[] // other Question ids worth reading alongside this one
  notes?: string // single shipped note, markdown
  tags?: string[]
}

export interface Reference {
  id: ID // what Question.references points to
  term: string // display label + auto-highlight match string in answer text
  text: RichText // the flashcard content shown on click
  notes?: string
}
