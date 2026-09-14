import { describe, expect, test } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { App } from './App'

describe('App', () => {
  test('renders LandingPage at /', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    await screen.findByText('Angular')
    expect(screen.getByText('Contents')).toBeDefined()
  })
})
