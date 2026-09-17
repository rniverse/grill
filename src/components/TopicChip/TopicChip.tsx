import type { ReactNode } from 'react'
import './TopicChip.css'

export interface TopicChipProps {
  children: ReactNode
}

// A light, low-contrast pill for a topic label sitting at the end of a list
// row — distinct from TopicBadge (bold/uppercase eyebrow label), which stays
// unchanged for dialog headers and detail-page meta blocks.
export function TopicChip({ children }: TopicChipProps) {
  return <span className="topic-chip">{children}</span>
}
