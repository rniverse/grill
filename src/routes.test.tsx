import { describe, expect, test } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from './routes'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
}

describe('routes', () => {
  test('renders LandingPage at /', async () => {
    renderAt('/')

    await screen.findByText('Angular')
    expect(screen.getAllByText('Contents').length).toBeGreaterThan(0)
  })

  test('renders TopicPage at /topics/:topicId', async () => {
    renderAt('/topics/angular')

    // Desktop and mobile each render their own <h1>, CSS-hidden at the other
    // width — both share the accessible name here.
    await screen.findAllByRole('heading', { name: 'Angular' })
    expect(screen.getAllByRole('heading', { name: 'Angular' }).length).toBeGreaterThan(0)
  })

  test('renders ReferencesPage topic picker at /references', async () => {
    renderAt('/references')

    expect(await screen.findByText('Angular')).toBeDefined()
  })

  test('renders ReferencesPage topic view at /references/:topicId', async () => {
    renderAt('/references/angular')

    expect(await screen.findByText('Signal')).toBeDefined()
  })

  test('renders BookmarksPage at /bookmarks', async () => {
    renderAt('/bookmarks')

    expect(await screen.findByText('Bookmarks')).toBeDefined()
  })

  test('renders QuestionsPage at /questions', async () => {
    renderAt('/questions')

    expect(await screen.findByText('My questions')).toBeDefined()
  })

  test('renders NotesPage at /notes', async () => {
    renderAt('/notes')

    expect(await screen.findByText('My notes')).toBeDefined()
  })
})
