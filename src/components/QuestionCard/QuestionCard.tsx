import type { Question, Reference } from '@/types/topic.types'
import { AnswerBody } from '@/components/AnswerBody/AnswerBody'
import './QuestionCard.css'

export interface QuestionCardProps {
  ordinal: string
  question: Question
  references: Reference[]
  open: boolean
  onToggle: () => void
  onReferenceSelect: (reference: Reference) => void
}

export function QuestionCard({ ordinal, question, references, open, onToggle, onReferenceSelect }: QuestionCardProps) {
  const citedReferences: Reference[] = []
  for (const referenceId of question.answer.references) {
    const reference = references.find((candidate) => candidate.id === referenceId)
    if (reference) {
      citedReferences.push(reference)
    }
  }

  return (
    <div className={open ? 'question-card question-card--open' : 'question-card'}>
      <button
        type="button"
        className="question-card__header"
        aria-expanded={open}
        aria-label={question.question}
        onClick={onToggle}
      >
        <span className="question-card__ordinal">{ordinal}</span>
        <span className="question-card__label">
          <span className="question-card__question">{question.question}</span>
          {question.tags && question.tags.length > 0 ? (
            <span className="question-card__tags">
              {question.tags.map((tag) => (
                <span key={tag} className="question-card__tag">
                  {tag}
                </span>
              ))}
            </span>
          ) : null}
        </span>
        <span className="question-card__chevron" aria-hidden="true">
          ⌄
        </span>
      </button>
      {open ? (
        <div className="question-card__body">
          <AnswerBody text={question.answer.text} references={citedReferences} onReferenceSelect={onReferenceSelect} />
        </div>
      ) : null}
    </div>
  )
}
