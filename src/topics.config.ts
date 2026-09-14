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
  load: () => Promise<TopicModule>
  loadReferences: () => Promise<ReferencesModule>
}

export const topicsConfig: TopicConfigEntry[] = [
  {
    id: 'angular',
    name: 'Angular',
    load: () => import('@/topics/angular'),
    loadReferences: () => import('@/references/angular'),
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    load: () => import('@/topics/nodejs'),
    loadReferences: () => import('@/references/nodejs'),
  },
]
