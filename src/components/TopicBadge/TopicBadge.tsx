import type { ReactNode } from 'react'
import './TopicBadge.css'

export interface TopicBadgeProps {
  children: ReactNode
}

export function TopicBadge({ children }: TopicBadgeProps) {
  return <span className="topic-badge">{children}</span>
}
