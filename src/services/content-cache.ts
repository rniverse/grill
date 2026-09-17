import type { ContentSourceConfig } from '@/config/content-sources'
import { content, type ReferencesModule, type SourceResult, type TopicModule } from '@/services/content'
import { storage } from '@/services/storage'

// In-memory only — never written to localStorage. Lives for the tab's
// session; gone on refresh. Caches the promise itself (not just the
// resolved value) so concurrent callers for the same source dedupe to one
// underlying fetch instead of racing.
const topicCache = new Map<string, Promise<SourceResult<TopicModule>>>()
const referencesCache = new Map<string, Promise<SourceResult<ReferencesModule>>>()

// Runs once per real fetch (never on a cache hit, since it's chained onto
// the promise at the moment it's created) — this is the single place a
// source's "checked/fetched at" timestamp gets written, so every page that
// loads content through this cache (Topic, References, Preferences'
// Validate) keeps that timestamp current without fetching for it specially.
function recordFetch<T>(sourceId: string, kind: 'topic' | 'references', promise: Promise<SourceResult<T>>): Promise<SourceResult<T>> {
  return promise.then((result) => {
    const at = new Date().toISOString()
    storage.update.sourceValidation(
      sourceId,
      kind,
      result.status === 'ok' ? { status: 'success', at } : { status: 'failed', at, error: result.error },
    )
    return result
  })
}

function resolveTopic(row: ContentSourceConfig, opts?: { force?: boolean }): Promise<SourceResult<TopicModule>> {
  if (opts?.force || !topicCache.has(row.id)) {
    topicCache.set(row.id, recordFetch(row.id, 'topic', content.load.topic(row)))
  }
  // biome-ignore lint/style/noNonNullAssertion: just set above if absent
  return topicCache.get(row.id)!
}

function resolveReferences(
  row: ContentSourceConfig,
  opts?: { force?: boolean },
): Promise<SourceResult<ReferencesModule>> {
  if (opts?.force || !referencesCache.has(row.id)) {
    referencesCache.set(row.id, recordFetch(row.id, 'references', content.load.references(row)))
  }
  // biome-ignore lint/style/noNonNullAssertion: just set above if absent
  return referencesCache.get(row.id)!
}

function clear(): void {
  topicCache.clear()
  referencesCache.clear()
}

export const contentCache = {
  resolve: {
    topic: resolveTopic,
    references: resolveReferences,
  },
  clear,
}
