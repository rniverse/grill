import { beforeEach, describe, expect, test } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobileNav } from './MobileNav'
import { savePendingQuestion } from '@/services/storage'
import { topic as angularTopic, questions as angularQuestions } from '@/topics/angular'

beforeEach(() => {
  localStorage.clear()
})

function renderNav(activeTopicId?: string) {
  render(
    <MemoryRouter>
      <MobileNav activeTopicId={activeTopicId} />
    </MemoryRouter>,
  )
}

describe('MobileNav', () => {
  test('renders a hamburger trigger and no drawer by default', () => {
    renderNav()

    expect(screen.getByRole('button', { name: 'Menu' })).toBeDefined()
    expect(screen.queryByText('Topics')).toBeNull()
  })

  test('opening the drawer lists every configured topic with its question count', async () => {
    renderNav()

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))

    expect(await screen.findByText('Angular')).toBeDefined()
    expect(await screen.findByText('Node.js')).toBeDefined()
    expect(await screen.findByText(String(angularQuestions.length))).toBeDefined()
  })

  test('marks the active topic when activeTopicId is given', async () => {
    renderNav('angular')

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))

    const angularLink = await screen.findByText('Angular')
    expect(angularLink.closest('a')?.getAttribute('aria-current')).toBe('true')
  })

  test('shows a live count of pending questions in the Yours section', async () => {
    savePendingQuestion({
      topic: { name: angularTopic.name, version: '1.0.0' },
      target: { kind: 'question', id: angularQuestions[0]!.id },
      selection: { text: 'some text', range: { start: 0, end: 9 } },
      ask: 'A question',
    })

    renderNav()
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))

    expect(await screen.findByText('My questions')).toBeDefined()
    expect(screen.getByText('1')).toBeDefined()
  })

  test('closing the drawer via the close button hides it again', async () => {
    renderNav()
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
    await screen.findByText('Topics')

    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }))

    expect(screen.queryByText('Topics')).toBeNull()
  })

  test('pressing Escape closes the drawer and returns focus to the hamburger trigger', async () => {
    renderNav()
    const trigger = screen.getByRole('button', { name: 'Menu' })
    fireEvent.click(trigger)
    await screen.findByText('Topics')

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(screen.queryByText('Topics')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  test('closing the drawer via the close button also returns focus to the hamburger trigger', async () => {
    renderNav()
    const trigger = screen.getByRole('button', { name: 'Menu' })
    fireEvent.click(trigger)
    await screen.findByText('Topics')

    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }))

    expect(document.activeElement).toBe(trigger)
  })

  test('clicking a topic closes the drawer', async () => {
    renderNav()
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))

    fireEvent.click(await screen.findByText('Angular'))

    expect(screen.queryByText('Topics')).toBeNull()
  })

  test('clicking export downloads the current personal layer as a JSON blob', async () => {
    const createdUrls: string[] = []
    const originalCreateObjectURL = URL.createObjectURL
    const originalRevokeObjectURL = URL.revokeObjectURL
    let capturedBlob: Blob | null = null

    URL.createObjectURL = (blob: Blob) => {
      capturedBlob = blob
      const url = 'blob:mock-url'
      createdUrls.push(url)
      return url
    }
    URL.revokeObjectURL = () => {}

    try {
      renderNav()
      fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
      fireEvent.click(await screen.findByText('Export personal layer'))

      expect(createdUrls).toHaveLength(1)
      expect(capturedBlob).not.toBeNull()
      expect((capturedBlob as unknown as Blob).type).toBe('application/json')
    } finally {
      URL.createObjectURL = originalCreateObjectURL
      URL.revokeObjectURL = originalRevokeObjectURL
    }
  })
})
