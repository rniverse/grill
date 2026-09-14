import type { TextSelection } from '@/types/personal.types'

export function locateSelection(
  containerText: string,
  selection: TextSelection,
): { start: number; end: number } | 'not-found' {
  void containerText
  void selection
  throw new Error('not implemented')
}
