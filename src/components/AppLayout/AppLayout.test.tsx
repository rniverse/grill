import { beforeEach, describe, expect, test } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { AppLayout } from './AppLayout'

beforeEach(() => {
  localStorage.clear()
})

function renderLayout() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<p>page content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('AppLayout', () => {
  test('renders IconRail and the routed page content', () => {
    renderLayout()

    expect(screen.getByRole('link', { name: 'Topics' })).toBeDefined()
    expect(screen.getByText('page content')).toBeDefined()
  })

  test('renders a MobileNav trigger once, shared across every route', () => {
    renderLayout()

    expect(screen.getByRole('button', { name: 'Menu' })).toBeDefined()
  })
})
