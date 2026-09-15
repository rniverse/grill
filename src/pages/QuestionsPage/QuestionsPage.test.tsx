import { beforeEach, describe, expect, test } from 'bun:test'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QuestionsPage } from './QuestionsPage'
import { savePendingQuestion } from '@/services/storage'
import { topic as angularTopic, questions as angularQuestions } from '@/topics/angular'

const angularQuestion = angularQuestions[0]!

beforeEach(() => {
  localStorage.clear()
})

function renderPage() {
  render(
    <MemoryRouter>
      <QuestionsPage />
    </MemoryRouter>,
  )
}

describe('QuestionsPage', () => {
  test('renders the page heading', async () => {
    renderPage()
    await act(async () => {})

    expect(screen.getByRole('heading', { name: 'My questions' })).toBeDefined()
  })

  test('renders a MobileNav trigger for phone widths', async () => {
    renderPage()
    await act(async () => {})

    expect(screen.getByRole('button', { name: 'Menu' })).toBeDefined()
  })

  test('shows the empty state with no pending questions', async () => {
    renderPage()

    expect(await screen.findByText('Select text in an answer to ask a question.')).toBeDefined()
  })

  test("shows a pending question's own ask text", async () => {
    savePendingQuestion({
      topic: { name: angularTopic.name, version: '1.0.0' },
      target: { kind: 'question', id: angularQuestion.id },
      selection: { text: 'some text', range: { start: 0, end: 9 } },
      ask: 'What does this mean in practice?',
    })

    renderPage()

    expect(await screen.findByText('What does this mean in practice?')).toBeDefined()
  })

  test('a pending question links to its topic page', async () => {
    savePendingQuestion({
      topic: { name: angularTopic.name, version: '1.0.0' },
      target: { kind: 'question', id: angularQuestion.id },
      selection: { text: 'some text', range: { start: 0, end: 9 } },
      ask: 'What does this mean in practice?',
    })

    renderPage()

    const link = await screen.findByRole('link', { name: 'What does this mean in practice?' })
    expect(link.getAttribute('href')).toBe('/topics/angular')
  })
})
