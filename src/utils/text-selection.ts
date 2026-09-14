import type { TextSelection } from '@/types/personal.types'

const MIN_SELECTION_LENGTH = 4

// Character offset of (node, offset) within container's flattened textContent.
// A range spanning from the start of the container to that point stringifies
// to the same text a textContent slice up to that offset would produce, so
// its length is the offset we want — this stays correct across the mixed
// element/text-node structure of a markdown-rendered container.
function textOffsetWithin(container: HTMLElement, node: Node, offset: number): number {
  const preceding = document.createRange()
  preceding.selectNodeContents(container)
  preceding.setEnd(node, offset)
  return preceding.toString().length
}

export function captureSelection(container: HTMLElement): TextSelection | null {
  const domSelection = window.getSelection()
  if (!domSelection || domSelection.isCollapsed || domSelection.rangeCount === 0) return null

  const range = domSelection.getRangeAt(0)
  const rawText = range.toString()
  const trimmedText = rawText.trim()
  if (trimmedText.length < MIN_SELECTION_LENGTH) return null

  const rawStart = textOffsetWithin(container, range.startContainer, range.startOffset)
  const rawEnd = textOffsetWithin(container, range.endContainer, range.endOffset)

  const leadingWhitespaceLength = rawText.length - rawText.trimStart().length
  const trailingWhitespaceLength = rawText.length - rawText.trimEnd().length

  return {
    text: trimmedText,
    range: {
      start: rawStart + leadingWhitespaceLength,
      end: rawEnd - trailingWhitespaceLength,
    },
  }
}
