import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { render, screen, act, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QuestionsPage } from './QuestionsPage'
import { storage } from '@/services/storage'
import { contentCache } from '@/services/content-cache'
import angularTopicData from '@/topics/angular.json'
import angularReferencesData from '@/references/angular.json'
import nodejsTopicData from '@/topics/nodejs.json'
import nodejsReferencesData from '@/references/nodejs.json'

const angularTopic = { name: angularTopicData.meta.name }
const angularQuestions = angularTopicData.questions
const angularReferences = angularReferencesData.references
const nodejsTopic = { name: nodejsTopicData.meta.name }
const nodejsReferences = nodejsReferencesData.references

const angularQuestion = angularQuestions[0]
const angularReference = angularReferences[0]
const nodejsReference = nodejsReferences[0]

function fixtureFor(url: string): unknown {
  if (url.includes('/topics/angular')) return angularTopicData
  if (url.includes('/references/angular')) return angularReferencesData
  if (url.includes('/topics/nodejs')) return nodejsTopicData
  if (url.includes('/references/nodejs')) return nodejsReferencesData
  throw new Error(`no fixture for ${url}`)
}

let fetchMock: ReturnType<typeof mock>

beforeEach(() => {
  localStorage.clear()
  contentCache.clear()
  fetchMock = mock(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString()
    return { ok: true, status: 200, json: async () => fixtureFor(url) } as Response
  })
  globalThis.fetch = fetchMock as unknown as typeof fetch
})

function renderPage() {
  return render(
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
    storage.create.question({
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
    storage.create.question({
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
    storage.create.question({
      topic: { name: angularTopic.name, version: '1.0.0' },
      target: { kind: 'question', id: angularQuestion.id },
      selection: { text: 'the quoted passage', range: { start: 0, end: 9 } },
      ask: 'What does this mean in practice?',
    })

    renderPage()

    fireEvent.click(await screen.findByText('What does this mean in practice?'))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('the quoted passage')).toBeDefined()
    // The dialog also shows which question this was asked against.
    expect(within(dialog).getByText(angularQuestion.question)).toBeDefined()
    const link = screen.getByRole('link', { name: 'Go to question' })
    expect(link.getAttribute('href')).toBe(`/topics/angular?question=${angularQuestion.id}`)
  })

  test('clicking a pending question on a reference target opens a dialog whose go-to-question button opens the reference', async () => {
    storage.create.question({
      topic: { name: angularTopic.name, version: '1.0.0' },
      target: { kind: 'reference', id: angularReference.id },
      selection: { text: 'the quoted passage', range: { start: 0, end: 9 } },
      ask: 'Why does this reference matter?',
    })

    renderPage()

    fireEvent.click(await screen.findByText('Why does this reference matter?'))
    // The dialog also shows which reference term this was asked against.
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(angularReference.term)).toBeDefined()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Go to reference' }))

    expect(await screen.findAllByText(angularReference.term)).not.toHaveLength(0)
  })

  test('removing a pending question from the dialog deletes it and closes the dialog', async () => {
    storage.create.question({
      topic: { name: angularTopic.name, version: '1.0.0' },
      target: { kind: 'question', id: angularQuestion.id },
      selection: { text: 'the quoted passage', range: { start: 0, end: 9 } },
      ask: 'What does this mean in practice?',
    })

    renderPage()
    fireEvent.click(await screen.findByText('What does this mean in practice?'))
    await screen.findByText('the quoted passage')

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))

    expect(storage.list.personal.questions()).toEqual([])
    expect(screen.queryByText('the quoted passage')).toBeNull()
  })

  test('closing the dialog via the close button hides it', async () => {
    storage.create.question({
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

  test('the row shows the real question text, above the pending question\'s own ask text', async () => {
    storage.create.question({
      topic: { name: angularTopic.name, version: '1.0.0' },
      target: { kind: 'question', id: angularQuestion.id },
      selection: { text: 'some text', range: { start: 0, end: 9 } },
      ask: 'What does this mean in practice?',
    })

    renderPage()

    const ask = await screen.findByText('What does this mean in practice?')
    const target = await screen.findByText(angularQuestion.question)

    expect(target.compareDocumentPosition(ask) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  test('the row shows the real reference term, above the pending question\'s own ask text', async () => {
    storage.create.question({
      topic: { name: angularTopic.name, version: '1.0.0' },
      target: { kind: 'reference', id: angularReference.id },
      selection: { text: 'some text', range: { start: 0, end: 9 } },
      ask: 'Why does this reference matter?',
    })

    renderPage()

    const ask = await screen.findByText('Why does this reference matter?')
    const target = await screen.findByText(angularReference.term)

    expect(target.compareDocumentPosition(ask) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  test('the row chip sits after the item label, not before it', async () => {
    storage.create.question({
      topic: { name: angularTopic.name, version: '1.0.0' },
      target: { kind: 'question', id: angularQuestion.id },
      selection: { text: 'some text', range: { start: 0, end: 9 } },
      ask: 'What does this mean in practice?',
    })

    renderPage()

    const label = await screen.findByText('What does this mean in practice?')
    const row = label.closest('.questions-page__item')
    if (!row) throw new Error('expected a row ancestor')
    const children = Array.from(row.children)
    const labelIndex = children.indexOf(label)
    const chipIndex = children.findIndex((child) => child.className.includes('topic-chip'))
    expect(chipIndex).toBeGreaterThan(labelIndex)
  })

  test('the dialog header still shows the bold TopicBadge, not the row chip', async () => {
    storage.create.question({
      topic: { name: angularTopic.name, version: '1.0.0' },
      target: { kind: 'question', id: angularQuestion.id },
      selection: { text: 'the quoted passage', range: { start: 0, end: 9 } },
      ask: 'What does this mean in practice?',
    })

    renderPage()
    fireEvent.click(await screen.findByText('What does this mean in practice?'))

    const header = document.querySelector('.questions-page__dialog-header')
    expect(header?.querySelector('.topic-badge')).toBeDefined()
    expect(header?.querySelector('.topic-chip')).toBeNull()
  })

  test('one question-target on angular + one reference-target on nodejs: only fetches angular topic + nodejs references, nothing else', async () => {
    storage.create.question({
      topic: { name: angularTopic.name, version: '1.0.0' },
      target: { kind: 'question', id: angularQuestion.id },
      selection: { text: 'some text', range: { start: 0, end: 9 } },
      ask: 'about angular',
    })
    storage.create.question({
      topic: { name: nodejsTopic.name, version: '1.0.0' },
      target: { kind: 'reference', id: nodejsReference.id },
      selection: { text: 'some text', range: { start: 0, end: 9 } },
      ask: 'about nodejs',
    })

    renderPage()
    await screen.findByText('about angular')
    await screen.findByText('about nodejs')

    const fetchedUrls = fetchMock.mock.calls.map((call) => String(call[0]))
    expect(fetchedUrls.some((url) => url.includes('/topics/angular'))).toBe(true)
    expect(fetchedUrls.some((url) => url.includes('/references/nodejs'))).toBe(true)
    expect(fetchedUrls.some((url) => url.includes('/references/angular'))).toBe(false)
    expect(fetchedUrls.some((url) => url.includes('/topics/nodejs'))).toBe(false)
    expect(fetchedUrls).toHaveLength(2)
  })

  test('re-mounting the page reuses the cache — no second round of fetches', async () => {
    storage.create.question({
      topic: { name: angularTopic.name, version: '1.0.0' },
      target: { kind: 'question', id: angularQuestion.id },
      selection: { text: 'some text', range: { start: 0, end: 9 } },
      ask: 'What does this mean in practice?',
    })

    const { unmount } = renderPage()
    await screen.findByText('What does this mean in practice?')
    const callsAfterFirstMount = fetchMock.mock.calls.length
    unmount()

    renderPage()
    await screen.findByText('What does this mean in practice?')

    expect(fetchMock.mock.calls.length).toBe(callsAfterFirstMount)
  })
})
