import { useState, type ReactNode } from 'react'
import { ChevronIcon } from '@/utils/icons'
import './CollapsibleSection.css'

export interface CollapsibleSectionProps {
  title: string
  children: ReactNode
}

// Collapsible only below --bp-mobile — desktop always shows the body.
// The expanded/collapsed state lives in React either way; CSS alone
// decides whether that state is visually honored, per breakpoint.
export function CollapsibleSection({ title, children }: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <section className="collapsible-section">
      <button
        type="button"
        className="collapsible-section__toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
      >
        <span className="collapsible-section__title">{title}</span>
        <ChevronIcon className="collapsible-section__chevron" size={16} aria-hidden="true" />
      </button>
      <div
        className={
          expanded
            ? 'collapsible-section__body'
            : 'collapsible-section__body collapsible-section__body--collapsed'
        }
      >
        {children}
      </div>
    </section>
  )
}
