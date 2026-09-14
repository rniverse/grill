import { Link } from 'react-router'
import './TopicRow.css'

export interface TopicRowProps {
  ordinal: string
  topicId: string
  name: string
  blurb?: string
  questionCount: number
}

export function TopicRow({ ordinal, topicId, name, blurb, questionCount }: TopicRowProps) {
  return (
    <Link to={`/topics/${topicId}`} className="topic-row">
      <span className="topic-row__ordinal">{ordinal}</span>
      <span className="topic-row__label">
        <span className="topic-row__name">{name}</span>
        {blurb ? <span className="topic-row__blurb">{blurb}</span> : null}
      </span>
      <span className="topic-row__leader" />
      <span className="topic-row__count">{questionCount}</span>
    </Link>
  )
}
