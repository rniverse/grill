import { useEffect, type RefObject } from 'react'
import type { PendingQuestion } from '@/types/personal.types'
import { locateSelection } from '@/utils/highlight'
import './PendingHighlight.css'

const HIGHLIGHT_MARKER = 'pendingHighlight'

// Undoes highlight spans from a previous run so text-node offsets are
// computed against the plain rendered text again, not text already split
// apart by <mark> wrappers from the last pass.
function unwrapExistingHighlights(container: HTMLElement): void {
  const marks = container.querySelectorAll<HTMLElement>(`mark[data-${HIGHLIGHT_MARKER}]`)
  for (const mark of Array.from(marks)) {
    const parent = mark.parentNode
    if (!parent) continue
    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark)
    }
    parent.removeChild(mark)
  }
  container.normalize()
}

// Inverse of the offset walk in utils/text-selection.ts: given a character
// offset into the container's flattened textContent, find the (node,
// offset) pair a DOM Range needs to point at that position.
function findRangeForOffsets(container: HTMLElement, start: number, end: number): Range | null {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  let cursor = 0
  let startNode: Node | null = null
  let startOffset = 0
  let endNode: Node | null = null
  let endOffset = 0

  let node: Node | null
  while ((node = walker.nextNode())) {
    const length = node.textContent?.length ?? 0
    const nodeStart = cursor
    const nodeEnd = cursor + length

    if (startNode === null && start >= nodeStart && start <= nodeEnd) {
      startNode = node
      startOffset = start - nodeStart
    }
    if (end >= nodeStart && end <= nodeEnd) {
      endNode = node
      endOffset = end - nodeStart
      break
    }
    cursor = nodeEnd
  }

  if (!startNode || !endNode) return null

  const range = document.createRange()
  range.setStart(startNode, startOffset)
  range.setEnd(endNode, endOffset)
  return range
}

export interface PendingHighlightProps {
  containerRef: RefObject<HTMLElement | null>
  pendingQuestions: PendingQuestion[]
}

// Renders nothing itself — it locates each pending question's selection
// inside the already-rendered AnswerBody output and wraps it in a highlight
// <mark>, imperatively, so it works regardless of the markdown structure
// react-markdown produced.
export function PendingHighlight({ containerRef, pendingQuestions }: PendingHighlightProps) {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    unwrapExistingHighlights(container)
    const containerText = container.textContent ?? ''

    for (const pending of pendingQuestions) {
      const located = locateSelection(containerText, pending.selection)
      if (located === 'not-found') continue

      const range = findRangeForOffsets(container, located.start, located.end)
      if (!range) continue

      const mark = document.createElement('mark')
      mark.dataset[HIGHLIGHT_MARKER] = 'true'
      mark.className = 'pending-highlight'
      mark.title = pending.ask

      try {
        const fragment = range.extractContents()
        mark.appendChild(fragment)
        range.insertNode(mark)
      } catch {
        // Range crossed an element boundary it can't wrap cleanly — skip
        // rather than risk corrupting the DOM react-markdown produced.
      }
    }
  }, [containerRef, pendingQuestions])

  return null
}
