import { describe, expect, test } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { LandingPage } from './LandingPage'

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
