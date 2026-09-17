import { Link } from 'react-router'
import './TopicRow.css'

export interface TopicRowProps {
  ordinal: string
  topicId: string
  name: string
  blurb?: string
  // Link target override — defaults to the topics route so existing callers
  // (LandingPage) are unaffected. ReferencesPage passes /references/:topicId
  // instead, reusing the row for its own topic-picker.
  to?: string
}

export function TopicRow({ ordinal, topicId, name, blurb, to }: TopicRowProps) {
  return (
    <Link to={to ?? `/topics/${topicId}`} className="topic-row">
      <span className="topic-row__ordinal">{ordinal}</span>
      <span className="topic-row__label">
        <span className="topic-row__name">{name}</span>
        {blurb ? <span className="topic-row__blurb">{blurb}</span> : null}
      </span>
      <span className="topic-row__leader" />
    </Link>
  )
}
