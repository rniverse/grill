import type { FileMeta, Question, Reference, Topic } from '@/types/topic.types'
import type { ContentSourceConfig } from '@/config/content-sources'
import { parseReferencesFile, parseTopicFile, type RawReferencesFile, type RawTopicFile } from '@/schemas/content.schema'

export interface TopicModule {
  topic: Topic
  meta: FileMeta
  questions: Question[]
}

export interface ReferencesModule {
  meta: FileMeta
  references: Reference[]
}

export type SourceResult<T> =
  | { status: 'ok'; data: T }
  | { status: 'error'; error: { message: string; meta?: unknown } }

const adapt = {
  topic(raw: RawTopicFile): TopicModule {
    return {
      topic: { id: raw.id, name: raw.meta.name },
      meta: { version: raw.meta.version, cutOffTime: raw.meta.cutOffTime, updatedAt: raw.meta.updatedAt },
      questions: raw.questions,
    }
  },
  references(raw: RawReferencesFile): ReferencesModule {
    return {
      meta: { version: raw.meta.version, cutOffTime: raw.meta.cutOffTime, updatedAt: raw.meta.updatedAt },
      references: raw.references,
    }
  },
}

const SCHEMA_ERROR_MESSAGE = 'response did not match the expected content schema'

function toFetchError(err: unknown, url: string): { message: string; meta?: unknown } {
  return { message: err instanceof Error ? err.message : 'Network request failed', meta: { url } }
}

// No caching of any kind here — every call does a real fetch + real
// validation. The browser's own HTTP cache may transparently speed up a
// repeat request; this module never manages that itself.
//
// `parse`'s return type is intentionally looser than Valibot's real
// SafeParseResult: on an untyped failure Valibot's own `output` is `unknown`
// rather than `T`, which makes the exact union type awkward to name here.
// We only ever branch on `success`, then trust `output` under a cast — the
// schema itself is what guarantees `T` on success.
async function fetchAndValidate<T>(
  url: string,
  parse: (data: unknown) => { success: boolean; output: unknown; issues?: unknown },
): Promise<SourceResult<T>> {
  let response: Response
  try {
    response = await fetch(url)
  } catch (err) {
    return { status: 'error', error: toFetchError(err, url) }
  }
  if (!response.ok) {
    return { status: 'error', error: { message: `HTTP ${response.status}`, meta: { url } } }
  }

  let json: unknown
  try {
    json = await response.json()
  } catch (err) {
    return { status: 'error', error: toFetchError(err, url) }
  }

  const result = parse(json)
  if (!result.success) {
    return { status: 'error', error: { message: SCHEMA_ERROR_MESSAGE, meta: result.issues } }
  }
  return { status: 'ok', data: result.output as T }
}

async function loadTopic(row: ContentSourceConfig): Promise<SourceResult<TopicModule>> {
  const url = row.source.topic
  if (!url) return { status: 'error', error: { message: 'no topic source configured for this row' } }

  const result = await fetchAndValidate<RawTopicFile>(url, parseTopicFile)
  if (result.status === 'error') return result
  return { status: 'ok', data: adapt.topic(result.data) }
}

async function loadReferences(row: ContentSourceConfig): Promise<SourceResult<ReferencesModule>> {
  const url = row.source.references
  if (!url) return { status: 'error', error: { message: 'no references source configured for this row' } }

  const result = await fetchAndValidate<RawReferencesFile>(url, parseReferencesFile)
  if (result.status === 'error') return result
  return { status: 'ok', data: adapt.references(result.data) }
}

export const content = {
  load: {
    topic: loadTopic,
    references: loadReferences,
  },
}
