import { describe, expect, test } from 'bun:test'
import { useRef } from 'react'
import { render } from '@testing-library/react'
import { PendingHighlight } from './PendingHighlight'
import type { PendingQuestion } from '@/types/personal.types'

const topic = { name: 'nodejs', version: '1.0.0' }
const target = { kind: 'question' as const, id: 'q1' }

function pendingQuestion(overrides: Partial<PendingQuestion>): PendingQuestion {
  return {
    id: 'p1',
    topic,
    target,
    selection: { text: 'brown fox', range: { start: 10, end: 19 } },
    ask: 'Why is it brown?',
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function Harness({ pendingQuestions }: { pendingQuestions: PendingQuestion[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  return (
    <div ref={containerRef} data-testid="container">
      <p>The quick brown fox jumps over the lazy dog.</p>
      <PendingHighlight containerRef={containerRef} pendingQuestions={pendingQuestions} />
    </div>
  )
}

describe('PendingHighlight', () => {
  test('wraps the stored range when it still matches (fast path)', () => {
    const text = 'The quick brown fox jumps over the lazy dog.'
    const start = text.indexOf('brown fox')
    const { getByTestId } = render(
      <Harness
        pendingQuestions={[
          pendingQuestion({ selection: { text: 'brown fox', range: { start, end: start + 'brown fox'.length } } }),
        ]}
      />,
    )

    const mark = getByTestId('container').querySelector('mark.pending-highlight')
    expect(mark?.textContent).toBe('brown fox')
    expect(mark?.getAttribute('title')).toBe('Why is it brown?')
  })

  test('re-locates the selection by searching when the stored range is stale', () => {
    const { getByTestId } = render(
      <Harness
        pendingQuestions={[pendingQuestion({ selection: { text: 'lazy dog', range: { start: 0, end: 8 } } })]}
      />,
    )

    const mark = getByTestId('container').querySelector('mark.pending-highlight')
    expect(mark?.textContent).toBe('lazy dog')
  })

  test('skips rendering a highlight when the text is no longer present', () => {
    const { getByTestId } = render(
      <Harness
        pendingQuestions={[pendingQuestion({ selection: { text: 'not in the text', range: { start: 0, end: 5 } } })]}
      />,
    )

    expect(getByTestId('container').querySelector('mark.pending-highlight')).toBeNull()
  })

  test('wraps multiple non-overlapping pending questions independently', () => {
    const { getByTestId } = render(
      <Harness
        pendingQuestions={[
          pendingQuestion({ id: 'p1', selection: { text: 'quick', range: { start: 0, end: 5 } } }),
          pendingQuestion({ id: 'p2', selection: { text: 'lazy dog', range: { start: 0, end: 8 } } }),
        ]}
      />,
    )

    const marks = getByTestId('container').querySelectorAll('mark.pending-highlight')
    expect(marks.length).toBe(2)
    expect(Array.from(marks).map((mark) => mark.textContent)).toEqual(['quick', 'lazy dog'])
  })
})
