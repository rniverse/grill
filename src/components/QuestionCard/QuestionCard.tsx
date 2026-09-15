import { useMemo, useRef, useState } from 'react'
import type { Question, Reference } from '@/types/topic.types'
import type { PendingQuestion } from '@/types/personal.types'
import {
  deletePersonalNote,
  getPersonalNote,
  listPendingQuestions,
  savePersonalNote,
  updatePersonalNote,
} from '@/services/storage'
import { t } from '@/utils/i18n'
import { RemoveIcon } from '@/utils/icons'
import { AnswerBody } from '@/components/AnswerBody/AnswerBody'
import { SelectionPlusButton } from '@/components/SelectionPlusButton/SelectionPlusButton'
import { PendingHighlight } from '@/components/PendingHighlight/PendingHighlight'
import { BookmarkButton } from '@/components/BookmarkButton/BookmarkButton'
import { NoteEditor } from '@/components/NoteEditor/NoteEditor'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
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

type NoteDialogState = 'closed' | 'view' | 'edit'

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
  const [noteDialog, setNoteDialog] = useState<NoteDialogState>('closed')
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

  function removeNote() {
    if (!personalNote) return
    deletePersonalNote(personalNote.id)
    onPersonalLayerChange?.()
    setNoteDialog('closed')
  }

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
            {personalNote ? (
              <div className="question-card__note-actions">
                <button
                  type="button"
                  className="question-card__note-toggle"
                  onClick={() => setNoteDialog('view')}
                >
                  {t('personal.note.expand')}
                </button>
                <button
                  type="button"
                  className="question-card__note-remove"
                  aria-label={t('personal.note.delete')}
                  title={t('personal.note.delete')}
                  onClick={removeNote}
                >
                  <RemoveIcon size={14} />
                </button>
              </div>
            ) : (
              <button type="button" className="question-card__note-toggle" onClick={() => setNoteDialog('edit')}>
                {t('personal.note.add')}
              </button>
            )}
          </div>

          <Dialog open={noteDialog !== 'closed'} onOpenChange={(isOpen) => !isOpen && setNoteDialog('closed')}>
            <DialogContent className="question-card__note-dialog">
              {noteDialog === 'edit' ? (
                <>
                  <DialogTitle className="question-card__note-dialog-title">{question.question}</DialogTitle>
                  <NoteEditor
                    initialValue={personalNote?.text ?? ''}
                    onSave={(text) => {
                      if (personalNote) {
                        updatePersonalNote(personalNote.id, text)
                      } else {
                        savePersonalNote(text, { target, topic })
                      }
                      onPersonalLayerChange?.()
                      setNoteDialog('closed')
                    }}
                    onCancel={() => setNoteDialog('closed')}
                  />
                </>
              ) : null}

              {noteDialog === 'view' && personalNote ? (
                <>
                  <DialogTitle className="question-card__note-dialog-title">{t('personal.note.eyebrow')}</DialogTitle>
                  <AnswerBody text={personalNote.text} references={[]} onReferenceSelect={() => {}} />
                  <div className="question-card__note-dialog-actions">
                    <button
                      type="button"
                      className="question-card__note-dialog-edit"
                      onClick={() => setNoteDialog('edit')}
                    >
                      {t('personal.note.edit')}
                    </button>
                    <button
                      type="button"
                      className="question-card__note-dialog-remove"
                      aria-label={t('personal.note.delete')}
                      title={t('personal.note.delete')}
                      onClick={removeNote}
                    >
                      <RemoveIcon size={16} />
                    </button>
                  </div>
                </>
              ) : null}
            </DialogContent>
          </Dialog>
        </div>
      ) : null}
    </div>
  )
}
