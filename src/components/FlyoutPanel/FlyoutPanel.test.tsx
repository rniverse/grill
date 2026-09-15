import { beforeEach, describe, expect, test } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { FlyoutPanel } from './FlyoutPanel'
import { RailSection } from '@/components/IconRail/rail-section.enum'
import { savePendingQuestion, savePersonalNote, toggleBookmark } from '@/services/storage'
import { topic as angularTopic, questions as angularQuestions } from '@/topics/angular'

const angularQuestion = angularQuestions[0]!

let closeCalls = 0
function handleClose(): void {
  closeCalls += 1
}

beforeEach(() => {
  localStorage.clear()
  closeCalls = 0
})

function renderPanel(section: RailSection, topicId?: string) {
  render(
    <MemoryRouter>
      <FlyoutPanel section={section} topicId={topicId} onClose={handleClose} />
    </MemoryRouter>,
  )
}

describe('FlyoutPanel', () => {
  test('Topics section lists every configured topic with its question count', async () => {
    renderPanel(RailSection.Topics)

    expect(await screen.findByText('Angular')).toBeDefined()
    expect(await screen.findByText('Node.js')).toBeDefined()
    expect(await screen.findByText(String(angularQuestions.length))).toBeDefined()
  })

  test('clicking a topic closes the panel', async () => {
    renderPanel(RailSection.Topics)

    fireEvent.click(await screen.findByText('Angular'))
    expect(closeCalls).toBe(1)
  })

  test('References section prompts for a topic when none is given', () => {
    renderPanel(RailSection.References)

    expect(screen.getByText('Open a topic to see its references.')).toBeDefined()
  })

  test('References section lists the current topic\'s references when topicId is given', async () => {
    renderPanel(RailSection.References, 'angular')

    expect(await screen.findByText('Signal')).toBeDefined()
    expect(await screen.findByText('OnPush')).toBeDefined()
  })

  test('Bookmarks section shows the empty state with no bookmarks', () => {
    renderPanel(RailSection.Bookmarks)

    expect(screen.getByText('Nothing bookmarked yet.')).toBeDefined()
  })

  test('Bookmarks section resolves a bookmarked question to its text, across topics', async () => {
    toggleBookmark(
      { kind: 'question', id: angularQuestion.id },
      { name: angularTopic.name, version: '1.0.0' },
    )

    renderPanel(RailSection.Bookmarks)

    expect(await screen.findByText(angularQuestion.question)).toBeDefined()
  })

  test('Questions section shows a pending question\'s own ask text', () => {
    savePendingQuestion({
      topic: { name: angularTopic.name, version: '1.0.0' },
      target: { kind: 'question', id: angularQuestion.id },
      selection: { text: 'some text', range: { start: 0, end: 9 } },
      ask: 'What does this mean in practice?',
    })

    renderPanel(RailSection.Questions)

    expect(screen.getByText('What does this mean in practice?')).toBeDefined()
  })

  test('Notes section shows a truncated preview of long notes', () => {
    const longText = 'a'.repeat(100)
    savePersonalNote(
      { kind: 'question', id: angularQuestion.id },
      { name: angularTopic.name, version: '1.0.0' },
      longText,
    )

    renderPanel(RailSection.Notes)

    expect(screen.getByText(`${'a'.repeat(80)}…`)).toBeDefined()
  })

  test('clicking the close button calls onClose', () => {
    renderPanel(RailSection.Topics)

    fireEvent.click(screen.getByRole('button', { name: 'Close panel' }))
    expect(closeCalls).toBe(1)
  })
})
