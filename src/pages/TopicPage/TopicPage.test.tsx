import { describe, expect, test } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { TopicPage } from './TopicPage'

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/topics/:topicId" element={<TopicPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TopicPage', () => {
  test('loads the topic and renders every question once', async () => {
    renderAt('/topics/angular')
    await screen.findByText('Angular')
    const questionButtons = await screen.findAllByRole('button', { name: /standalone/i })
    expect(questionButtons.length).toBeGreaterThan(0)
  })

  test('expanding a question shows its answer', async () => {
    renderAt('/topics/angular')
    const toggles = await screen.findAllByRole('button', { name: /standalone/i })
    fireEvent.click(toggles[0])
    expect(await screen.findByText(/removes a layer of indirection/i)).toBeDefined()
  })

  test('filtering by tag hides non-matching questions', async () => {
    renderAt('/topics/angular')
    await screen.findByText('Angular')
    const allButtons = await screen.findAllByRole('button')
    const initialCount = allButtons.filter((button) => button.className.includes('question-card__header')).length
    const architectureChip = screen.getByRole('button', { name: 'Fundamentals & Architecture' })
    fireEvent.click(architectureChip)
    const filteredButtons = screen.getAllByRole('button').filter((button) => button.className.includes('question-card__header'))
    expect(filteredButtons.length).toBeLessThan(initialCount)
  })

  test('shows a not-found message for an unknown topic id', async () => {
    renderAt('/topics/does-not-exist')
    expect(await screen.findByText('Topic not found.')).toBeDefined()
  })

  test('clicking a reference badge in an answer opens the modal for that reference', async () => {
    renderAt('/topics/nodejs')
    const toggle = await screen.findByRole('button', { name: /priority order between/i })
    fireEvent.click(toggle)

    const badge = await screen.findByText('event loop', { selector: '.reference-badge' })
    fireEvent.click(badge)

    expect(await screen.findByText('Event Loop')).toBeDefined()
    expect(
      await screen.findByText(/repeatedly moves through six phases/i),
    ).toBeDefined()
  })
})
