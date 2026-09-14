import { describe, expect, test } from 'bun:test'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReferenceModal } from './ReferenceModal'
import type { Reference } from '@/types/topic.types'

const bufferRef: Reference = { id: 'r1', term: 'Buffer', text: { type: 'markdown.text', value: 'A raw-memory container.' } }

describe('ReferenceModal', () => {
  test('renders nothing when there is no reference', () => {
    const { container } = render(<ReferenceModal reference={null} onClose={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  test('renders the term and calls onClose from the close button', () => {
    const onClose = () => {
      closed = true
    }
    let closed = false
    render(<ReferenceModal reference={bufferRef} onClose={onClose} />)

    expect(screen.getByText('Buffer')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(closed).toBe(true)
  })

  test('closes on Escape', () => {
    let closed = false
    render(<ReferenceModal reference={bufferRef} onClose={() => (closed = true)} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(closed).toBe(true)
  })

  // The overlay's scrim/z-index come from a global rule in src/styles/global.css
  // keyed off this data-slot (DialogContent's internal DialogOverlay exposes no
  // className hook) — this pins the attribute our selector depends on.
  test('renders an overlay carrying the dialog-overlay data-slot', () => {
    render(<ReferenceModal reference={bufferRef} onClose={() => {}} />)
    expect(document.querySelector('[data-slot="dialog-overlay"]')).not.toBeNull()
  })
})
