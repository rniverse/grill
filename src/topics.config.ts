import type { FileMeta, Question, Topic } from '@/types/topic.types'

export interface TopicModule {
  topic: Topic
  meta: FileMeta
  questions: Question[]
}

export interface TopicConfigEntry {
  id: string
  name: string
  load: () => Promise<TopicModule>
}

export const topicsConfig: TopicConfigEntry[] = [
  {
    id: 'angular',
    name: 'Angular',
    load: () => import('@/topics/angular'),
  },
]
