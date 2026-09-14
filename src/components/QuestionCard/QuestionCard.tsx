import { useMemo, useRef, useState } from 'react'
import type { Question, Reference } from '@/types/topic.types'
import type { PendingQuestion } from '@/types/personal.types'
import { getPersonalNote, listPendingQuestions, savePersonalNote } from '@/services/storage'
import { t } from '@/utils/i18n'
import { AnswerBody } from '@/components/AnswerBody/AnswerBody'
import { SelectionPlusButton } from '@/components/SelectionPlusButton/SelectionPlusButton'
import { PendingHighlight } from '@/components/PendingHighlight/PendingHighlight'
import { BookmarkButton } from '@/components/BookmarkButton/BookmarkButton'
import { NoteView } from '@/components/NoteView/NoteView'
import { NoteEditor } from '@/components/NoteEditor/NoteEditor'
import './QuestionCard.css'

export interface QuestionCardProps {
  ordinal: string
  question: Question
  references: Reference[]
  topic: { name: string; version: string }
  open: boolean
  onToggle: () => void
  onReferenceSelect: (reference: Reference) => void
  onPersonalLayerChange?: () => void
}

export function QuestionCard({
  ordinal,
  question,
  references,
  topic,
  open,
  onToggle,
  onReferenceSelect,
  onPersonalLayerChange,
}: QuestionCardProps) {
  const answerRef = useRef<HTMLDivElement>(null)
  const [editingNote, setEditingNote] = useState(false)
  const target = { kind: 'question' as const, id: question.id }

  const citedReferences: Reference[] = []
  for (const referenceId of question.references) {
    const reference = references.find((candidate) => candidate.id === referenceId)
    if (reference) {
      citedReferences.push(reference)
    }
  }

  const personalNote = getPersonalNote(target)

  const matchingPendingQuestions = listPendingQuestions().filter(
    (pending) => pending.target.kind === 'question' && pending.target.id === question.id,
  )
  // A content fingerprint of this question's pending questions. Serializing
  // to JSON and parsing it back inside the memo below (rather than depending
  // on matchingPendingQuestions directly, which is a fresh array literal on
  // every render) means PendingHighlight only receives a new array reference
  // when a pending question for *this* target was actually added, removed,
  // or edited — not on every unrelated re-render (opening a different card,
  // changing a filter, etc.) that would otherwise re-trigger its DOM effect.
  const pendingQuestionsFingerprint = JSON.stringify(matchingPendingQuestions)

  const pendingQuestions = useMemo(
    () => JSON.parse(pendingQuestionsFingerprint) as PendingQuestion[],
    [pendingQuestionsFingerprint],
  )

  return (
    <div className={open ? 'question-card question-card--open' : 'question-card'}>
      <div className="question-card__header-row">
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
        <BookmarkButton topic={topic} target={target} onToggle={onPersonalLayerChange} />
      </div>
      {open ? (
        <div className="question-card__body">
          <div className="question-card__answer" ref={answerRef}>
            <AnswerBody text={question.answer.value} references={citedReferences} onReferenceSelect={onReferenceSelect} />
            <SelectionPlusButton
              containerRef={answerRef}
              topic={topic}
              target={target}
              onSaved={onPersonalLayerChange}
            />
            <PendingHighlight containerRef={answerRef} pendingQuestions={pendingQuestions} />
          </div>
          <div className="question-card__note">
            {editingNote ? (
              <NoteEditor
                initialValue={personalNote?.text ?? ''}
                onSave={(text) => {
                  savePersonalNote(target, topic, text)
                  setEditingNote(false)
                  onPersonalLayerChange?.()
                }}
                onCancel={() => setEditingNote(false)}
              />
            ) : personalNote ? (
              <>
                <NoteView note={personalNote} />
                <button type="button" className="question-card__note-toggle" onClick={() => setEditingNote(true)}>
                  {t('personal.noteEdit')}
                </button>
              </>
            ) : (
              <button type="button" className="question-card__note-toggle" onClick={() => setEditingNote(true)}>
                {t('personal.noteAdd')}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
