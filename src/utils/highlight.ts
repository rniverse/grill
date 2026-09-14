import type { TextSelection } from '@/types/personal.types'

export function locateSelection(
  containerText: string,
  selection: TextSelection,
): { start: number; end: number } | 'not-found' {
  const { text, range } = selection

  const atStoredRange = containerText.slice(range.start, range.end)
  if (atStoredRange === text) return { start: range.start, end: range.end }

  const foundIndex = containerText.indexOf(text)
  if (foundIndex === -1) return 'not-found'

  return { start: foundIndex, end: foundIndex + text.length }
}
