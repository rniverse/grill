import { ulid } from 'ulid'
import type { ID } from '@/types/topic.types'

export function generateId(): ID {
  return ulid()
}
