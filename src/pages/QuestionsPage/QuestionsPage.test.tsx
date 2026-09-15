import { beforeEach, describe, expect, test } from 'bun:test'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QuestionsPage } from './QuestionsPage'
import { listPendingQuestions, savePendingQuestion } from '@/services/storage'
import angularTopicData from '@/topics/angular.json'
import angularReferencesData from '@/references/angular.json'

const angularTopic = { name: angularTopicData.meta.name }
const angularQuestions = angularTopicData.questions
const angularReferences = angularReferencesData.references

const angularQuestion = angularQuestions[0]
const angularReference = angularReferences[0]

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

  test('renders a Questions section and a References section', async () => {
    renderPage()
    await act(async () => {})

    expect(screen.getByRole('button', { name: 'Questions' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'References' })).toBeDefined()
  })

  test('renders a MobileNav trigger for phone widths', async () => {
    renderPage()
    await act(async () => {})

    expect(screen.getByRole('button', { name: 'Menu' })).toBeDefined()
  })

  test('shows the empty state in both sections with no pending questions', async () => {
    renderPage()

    expect(await screen.findByText('Select text in an answer to ask a question.')).toBeDefined()
    expect(await screen.findByText('Select text in a reference to ask a question.')).toBeDefined()
  })

  test("shows a pending question's own ask text, asked on a question target", async () => {
    savePendingQuestion({
      topic: { name: angularTopic.name, version: '1.0.0' },
      target: { kind: 'question', id: angularQuestion.id },
      selection: { text: 'some text', range: { start: 0, end: 9 } },
      ask: 'What does this mean in practice?',
    })

    renderPage()

    expect(await screen.findByText('What does this mean in practice?')).toBeDefined()
    // Questions section is no longer empty; References section still is.
    expect(screen.queryByText('Select text in an answer to ask a question.')).toBeNull()
    expect(await screen.findByText('Select text in a reference to ask a question.')).toBeDefined()
  })

  test('a pending question asked on a reference target shows under the References section', async () => {
    savePendingQuestion({
      topic: { name: angularTopic.name, version: '1.0.0' },
      target: { kind: 'reference', id: angularReference.id },
      selection: { text: 'some text', range: { start: 0, end: 9 } },
      ask: 'Why does this reference matter?',
    })

    renderPage()

    expect(await screen.findByText('Why does this reference matter?')).toBeDefined()
    expect(await screen.findByText('Select text in an answer to ask a question.')).toBeDefined()
    expect(screen.queryByText('Select text in a reference to ask a question.')).toBeNull()
  })

  test('clicking a pending question on a question target opens a dialog with a go-to-question link', async () => {
    savePendingQuestion({
      topic: { name: angularTopic.name, version: '1.0.0' },
      target: { kind: 'question', id: angularQuestion.id },
      selection: { text: 'the quoted passage', range: { start: 0, end: 9 } },
      ask: 'What does this mean in practice?',
    })

    renderPage()

    fireEvent.click(await screen.findByText('What does this mean in practice?'))

    expect(await screen.findByText('the quoted passage')).toBeDefined()
    // The dialog also shows which question this was asked against.
    expect(await screen.findByText(angularQuestion.question)).toBeDefined()
    const link = screen.getByRole('link', { name: 'Go to question' })
    expect(link.getAttribute('href')).toBe(`/topics/angular?question=${angularQuestion.id}`)
  })

  test('clicking a pending question on a reference target opens a dialog whose go-to-question button opens the reference', async () => {
    savePendingQuestion({
      topic: { name: angularTopic.name, version: '1.0.0' },
      target: { kind: 'reference', id: angularReference.id },
      selection: { text: 'the quoted passage', range: { start: 0, end: 9 } },
      ask: 'Why does this reference matter?',
    })

    renderPage()

    fireEvent.click(await screen.findByText('Why does this reference matter?'))
    // The dialog also shows which reference term this was asked against.
    expect(await screen.findByText(angularReference.term)).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Go to reference' }))

    expect(await screen.findAllByText(angularReference.term)).not.toHaveLength(0)
  })

  test('removing a pending question from the dialog deletes it and closes the dialog', async () => {
    savePendingQuestion({
      topic: { name: angularTopic.name, version: '1.0.0' },
      target: { kind: 'question', id: angularQuestion.id },
      selection: { text: 'the quoted passage', range: { start: 0, end: 9 } },
      ask: 'What does this mean in practice?',
    })

    renderPage()
    fireEvent.click(await screen.findByText('What does this mean in practice?'))
    await screen.findByText('the quoted passage')

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))

    expect(listPendingQuestions()).toEqual([])
    expect(screen.queryByText('the quoted passage')).toBeNull()
  })

  test('closing the dialog via the close button hides it', async () => {
    savePendingQuestion({
      topic: { name: angularTopic.name, version: '1.0.0' },
      target: { kind: 'question', id: angularQuestion.id },
      selection: { text: 'the quoted passage', range: { start: 0, end: 9 } },
      ask: 'What does this mean in practice?',
    })

    renderPage()
    fireEvent.click(await screen.findByText('What does this mean in practice?'))
    await screen.findByText('the quoted passage')

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(screen.queryByText('the quoted passage')).toBeNull()
  })
})
