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

export interface Answer {
  id: ID
  text: string // markdown, may include mermaid fences
  references: ID[] // Reference ids cited in this answer
  related: ID[] // other Question ids worth reading alongside this one
}

export interface Question {
  id: ID
  question: string
  answer: Answer
  notes?: string // single shipped note, markdown
  tags?: string[]
}

export interface Reference {
  id: ID // what Answer.references points to
  term: string // display label + auto-highlight match string in answer text
  text: string // markdown — the flashcard content shown on click
  notes?: string
}
