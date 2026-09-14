import { beforeEach, describe, expect, test } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'
import { PersonalRail } from './PersonalRail'
import {
  listPendingQuestions,
  listPersonalNotes,
  savePendingQuestion,
  savePersonalNote,
  toggleBookmark,
} from '@/services/storage'
import type { Question, Reference } from '@/types/topic.types'

const topic = { name: 'nodejs', version: '1.0.0' }
const otherTopic = { name: 'angular', version: '1.0.0' }

const questions: Question[] = [
  {
    id: 'q1',
    question: 'What is the Event Loop?',
    references: [],
    related: [],
    answer: { type: 'markdown.text', value: 'It processes callbacks.' },
  },
]
const references: Reference[] = [{ id: 'r1', term: 'libuv', text: { type: 'markdown.text', value: 'A C library.' } }]

beforeEach(() => {
  localStorage.clear()
})

describe('PersonalRail', () => {
  test('shows the questions tab empty state by default', () => {
    render(
      <PersonalRail
        topic={topic}
        questions={questions}
        references={references}
        onOpenQuestion={() => {}}
        onOpenReference={() => {}}
      />,
    )
    expect(screen.getByText('Select text in an answer to ask a question.')).toBeDefined()
  })

  test('lists pending questions for the current topic and opens the target on click', () => {
    savePendingQuestion({
      topic,
      target: { kind: 'question', id: 'q1' },
      selection: { text: 'callbacks', range: { start: 0, end: 9 } },
      ask: 'When do these run?',
    })
    savePendingQuestion({
      topic: otherTopic,
      target: { kind: 'question', id: 'other' },
      selection: { text: 'foo', range: { start: 0, end: 3 } },
      ask: 'irrelevant',
    })

    const captured: { openedQuestionId: string | null } = { openedQuestionId: null }
    render(
      <PersonalRail
        topic={topic}
        questions={questions}
        references={references}
        onOpenQuestion={(id) => (captured.openedQuestionId = id)}
        onOpenReference={() => {}}
      />,
    )

    expect(screen.getByText('When do these run?')).toBeDefined()
    expect(screen.queryByText('irrelevant')).toBeNull()

    fireEvent.click(screen.getByText('When do these run?'))
    expect(captured.openedQuestionId).toBe('q1')
  })

  test('removing a pending question deletes it from storage', () => {
    savePendingQuestion({
      topic,
      target: { kind: 'question', id: 'q1' },
      selection: { text: 'callbacks', range: { start: 0, end: 9 } },
      ask: 'When do these run?',
    })

    render(
      <PersonalRail
        topic={topic}
        questions={questions}
        references={references}
        onOpenQuestion={() => {}}
        onOpenReference={() => {}}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))

    expect(listPendingQuestions()).toEqual([])
  })

  test('bookmarks tab lists bookmarked questions and references for the topic', () => {
    toggleBookmark({ kind: 'question', id: 'q1' }, topic)
    toggleBookmark({ kind: 'reference', id: 'r1' }, topic)

    const captured: { openedReferenceTerm: string | null } = { openedReferenceTerm: null }
    render(
      <PersonalRail
        topic={topic}
        questions={questions}
        references={references}
        onOpenQuestion={() => {}}
        onOpenReference={(reference) => (captured.openedReferenceTerm = reference.term)}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Bookmarks' }))

    expect(screen.getByText('What is the Event Loop?')).toBeDefined()
    expect(screen.getByText('libuv')).toBeDefined()

    fireEvent.click(screen.getByText('libuv'))
    expect(captured.openedReferenceTerm).toBe('libuv')
  })

  test('notes tab lists personal notes for the topic with a truncated preview', () => {
    savePersonalNote({ kind: 'question', id: 'q1' }, topic, 'A fairly short personal note.')

    render(
      <PersonalRail
        topic={topic}
        questions={questions}
        references={references}
        onOpenQuestion={() => {}}
        onOpenReference={() => {}}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Notes' }))

    expect(screen.getByText('A fairly short personal note.')).toBeDefined()
  })

  test('renders a pending question whose selection can no longer be located under a needs-review heading', () => {
    savePendingQuestion({
      topic,
      target: { kind: 'question', id: 'q1' },
      selection: { text: 'this text is nowhere in the answer', range: { start: 0, end: 5 } },
      ask: 'Where did this go?',
    })

    render(
      <PersonalRail
        topic={topic}
        questions={questions}
        references={references}
        onOpenQuestion={() => {}}
        onOpenReference={() => {}}
      />,
    )

    expect(screen.getByText('Needs review')).toBeDefined()
    const heading = screen.getByText('Needs review')
    const item = screen.getByText('Where did this go?')
    // the needs-review item renders after the heading, inside its section
    expect(heading.compareDocumentPosition(item) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  test('a locatable pending question does not render under the needs-review heading', () => {
    savePendingQuestion({
      topic,
      target: { kind: 'question', id: 'q1' },
      selection: { text: 'callbacks', range: { start: 0, end: 9 } },
      ask: 'When do these run?',
    })

    render(
      <PersonalRail
        topic={topic}
        questions={questions}
        references={references}
        onOpenQuestion={() => {}}
        onOpenReference={() => {}}
      />,
    )

    expect(screen.getByText('When do these run?')).toBeDefined()
    expect(screen.queryByText('Needs review')).toBeNull()
  })

  test('removing a note deletes it from storage', () => {
    savePersonalNote({ kind: 'question', id: 'q1' }, topic, 'temporary note')

    render(
      <PersonalRail
        topic={topic}
        questions={questions}
        references={references}
        onOpenQuestion={() => {}}
        onOpenReference={() => {}}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Notes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))

    expect(listPersonalNotes()).toEqual([])
  })

  test('shows the bookmarks and notes empty states', () => {
    render(
      <PersonalRail
        topic={topic}
        questions={questions}
        references={references}
        onOpenQuestion={() => {}}
        onOpenReference={() => {}}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Bookmarks' }))
    expect(screen.getByText('Nothing bookmarked yet.')).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Notes' }))
    expect(screen.getByText('No notes yet.')).toBeDefined()
  })
})
