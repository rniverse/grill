import * as v from 'valibot'

const RichTextSchema = v.object({
  type: v.picklist(['simple', 'markdown.text', 'markdown.ref']),
  value: v.string(),
})

const QuestionSchema = v.object({
  id: v.string(),
  question: v.string(),
  answer: RichTextSchema,
  references: v.array(v.string()),
  related: v.array(v.string()),
  notes: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
})

const ReferenceSchema = v.object({
  id: v.string(),
  term: v.string(),
  text: RichTextSchema,
  notes: v.optional(v.string()),
})

const FileMetaSchema = v.object({
  version: v.string(),
  cutOffTime: v.string(),
  updatedAt: v.string(),
  type: v.picklist(['topic', 'reference']),
  name: v.string(),
})

const RawTopicFileSchema = v.object({
  id: v.string(),
  meta: FileMetaSchema,
  questions: v.array(QuestionSchema),
})

const RawReferencesFileSchema = v.object({
  id: v.string(),
  meta: FileMetaSchema,
  references: v.array(ReferenceSchema),
})

export type RawTopicFile = v.InferOutput<typeof RawTopicFileSchema>
export type RawReferencesFile = v.InferOutput<typeof RawReferencesFileSchema>

export function parseTopicFile(data: unknown) {
  return v.safeParse(RawTopicFileSchema, data)
}

export function parseReferencesFile(data: unknown) {
  return v.safeParse(RawReferencesFileSchema, data)
}
