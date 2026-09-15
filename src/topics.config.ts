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
  name: string
  load: {
    topics: () => Promise<TopicModule>
    references: () => Promise<ReferencesModule>
  }
}

// On-disk shape of a content file (src/topics/*.json, src/references/*.json)
// — meta.name/type describe the bundle itself, ready for a future loader
// that also accepts user-imported JSON in this same shape. There's no
// separate slug in the file; the route slug ('angular') comes from this
// config, not the content.
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

function adaptTopic(slug: string, raw: RawTopicFile): TopicModule {
  return {
    topic: { id: slug, name: raw.meta.name },
    meta: { version: raw.meta.version, cutOffTime: raw.meta.cutOffTime, updatedAt: raw.meta.updatedAt },
    questions: raw.questions,
  }
}

function adaptReferences(raw: RawReferencesFile): ReferencesModule {
  return { references: raw.references }
}

export const topicsConfig: TopicConfigEntry[] = [
  {
    id: 'angular',
    name: 'Angular',
    load: {
      topics: () => import('@/topics/angular.json').then((module) => adaptTopic('angular', module.default as RawTopicFile)),
      references: () =>
        import('@/references/angular.json').then((module) => adaptReferences(module.default as RawReferencesFile)),
    },
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    load: {
      topics: () => import('@/topics/nodejs.json').then((module) => adaptTopic('nodejs', module.default as RawTopicFile)),
      references: () =>
        import('@/references/nodejs.json').then((module) => adaptReferences(module.default as RawReferencesFile)),
    },
  },
]
