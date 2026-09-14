import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { LandingPage } from './LandingPage'

// @testing-library/react's own auto-cleanup only registers once, in whichever
// test file happens to import it first (bun:test scopes lifecycle hooks per
// file) — explicit cleanup here keeps this file's two renders independent
// regardless of run order relative to other test files.
afterEach(cleanup)

describe('LandingPage', () => {
  test('renders a row for each configured topic once loaded', async () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )

    const angularRow = await screen.findByText('Angular')
    expect(angularRow).toBeDefined()
  })

  test('renders the CONTENTS label and search/import controls', async () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )

    await screen.findByText('Angular')
    expect(screen.getByText('Contents')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Search' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Import' })).toBeDefined()
  })
})
