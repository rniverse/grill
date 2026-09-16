import type { FileMeta, Question, Reference, Topic } from '@/types/topic.types'

export interface TopicModule {
  topic: Topic
  meta: FileMeta
  questions: Question[]
}

export interface ReferencesModule {
  references: Reference[]
}

export interface TopicConfigEntry {
  id: string
  load: {
    topics: () => Promise<TopicModule>
    references: () => Promise<ReferencesModule>
  }
}

// On-disk shape of a content file (src/topics/*.json, src/references/*.json)
// — meta.name/type describe the bundle itself, ready for a future loader
// that also accepts user-imported JSON in this same shape.
interface RawContentMeta extends FileMeta {
  type: 'topic' | 'reference'
  name: string
}

interface RawTopicFile {
  id: string
  meta: RawContentMeta
  questions: Question[]
}

interface RawReferencesFile {
  id: string
  meta: RawContentMeta
  references: Reference[]
}

const adapt = {
  topic(raw: RawTopicFile): TopicModule {
    return {
      topic: { id: raw.id, name: raw.meta.name },
      meta: { version: raw.meta.version, cutOffTime: raw.meta.cutOffTime, updatedAt: raw.meta.updatedAt },
      questions: raw.questions,
    }
  },
  references(raw: RawReferencesFile): ReferencesModule {
    return { references: raw.references }
  },
}

// Each slug names a src/topics/<slug>.json + src/references/<slug>.json
// pair. The slug only picks which files to load; the topic's actual id and
// name come from the files themselves (raw.id / raw.meta.name) once
// loaded, not retyped here.
const topicSlugs = ['angular', 'nodejs'] as const

export const topicsConfig: TopicConfigEntry[] = topicSlugs.map((slug) => ({
  id: slug,
  load: {
    topics: () => import(`@/topics/${slug}.json`).then((module) => adapt.topic(module.default as RawTopicFile)),
    references: () =>
      import(`@/references/${slug}.json`).then((module) => adapt.references(module.default as RawReferencesFile)),
  },
}))
