import type { Bookmark, LocalTargetRef, PendingQuestion, PersonalNote } from '@/types/personal.types'
import type { ID } from '@/types/topic.types'

export function listPendingQuestions(): PendingQuestion[] {
  throw new Error('not implemented')
}

export function savePendingQuestion(
  input: Omit<PendingQuestion, 'id' | 'createdAt'>,
): PendingQuestion {
  void input
  throw new Error('not implemented')
}

export function deletePendingQuestion(id: ID): void {
  void id
  throw new Error('not implemented')
}

export function listPersonalNotes(): PersonalNote[] {
  throw new Error('not implemented')
}

export function getPersonalNote(target: LocalTargetRef['target']): PersonalNote | undefined {
  void target
  throw new Error('not implemented')
}

export function savePersonalNote(
  target: LocalTargetRef['target'],
  topic: LocalTargetRef['topic'],
  text: string,
): PersonalNote {
  void target
  void topic
  void text
  throw new Error('not implemented')
}

export function deletePersonalNote(id: ID): void {
  void id
  throw new Error('not implemented')
}

export function listBookmarks(): Bookmark[] {
  throw new Error('not implemented')
}

export function isBookmarked(target: LocalTargetRef['target']): boolean {
  void target
  throw new Error('not implemented')
}

export function toggleBookmark(target: LocalTargetRef['target'], topic: LocalTargetRef['topic']): void {
  void target
  void topic
  throw new Error('not implemented')
}

export function exportPersonalLayer(): string {
  throw new Error('not implemented')
}

export function importPersonalLayer(json: string): void {
  void json
  throw new Error('not implemented')
}
