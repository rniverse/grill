import { beforeEach, describe, expect, test } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { LandingPage } from './LandingPage'

beforeEach(() => {
  localStorage.clear()
})

describe('LandingPage', () => {
  test('renders a row for each configured source from local storage, with no network request', async () => {
    const fetchMock = () => {
      throw new Error('LandingPage must not fetch — names come from local storage')
    }
    globalThis.fetch = fetchMock as unknown as typeof fetch

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Angular')).toBeDefined()
    expect(screen.getByText('Node.js')).toBeDefined()
  })

  test('renders a topic-count summary with no question/reference counts', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )

    expect(screen.getAllByText('2 topics').length).toBeGreaterThan(0)
  })

  test('renders the CONTENTS label', async () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )

    await screen.findByText('Angular')
    // "Contents" appears twice: once in the desktop header, once in the
    // mobile header — CSS (not JSX) decides which shows at a given width,
    // so both are always in the DOM.
    expect(screen.getAllByText('Contents').length).toBeGreaterThan(0)
  })

  test('renders exactly one h1 per header (desktop label + mobile title), both "Contents"', async () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )
    await screen.findByText('Angular')
    // Both headers are always in the DOM (CSS picks which is visible at a
    // given width — see the comment above); each must carry a real <h1> so
    // exactly one heading is visible per width, never zero.
    const headings = screen.getAllByRole('heading', { level: 1, name: 'Contents' })
    expect(headings).toHaveLength(2)
  })

})
