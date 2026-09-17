import { useMemo, useRef } from 'react'
import type { Reference } from '@/types/topic.types'
import type { PendingQuestion } from '@/types/personal.types'
import { storage } from '@/services/storage'
import { t } from '@/utils/i18n'
import { CloseIcon } from '@/utils/icons'
import { AnswerBody } from '@/components/AnswerBody/AnswerBody'
import { BookmarkButton } from '@/components/BookmarkButton/BookmarkButton'
import { SelectionPlusButton } from '@/components/SelectionPlusButton/SelectionPlusButton'
import { PendingHighlight } from '@/components/PendingHighlight/PendingHighlight'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import './ReferenceModal.css'

export interface ReferenceModalProps {
  reference: Reference | null
  topic: { name: string; version: string }
  onClose: () => void
  onPersonalLayerChange?: () => void
}

export function ReferenceModal({ reference, topic, onClose, onPersonalLayerChange }: ReferenceModalProps) {
  const answerRef = useRef<HTMLDivElement>(null)

  // Hooks must run unconditionally, so the early null-return for "no
  // reference selected" happens after these, not before — mirrors the same
  // ordering constraint QuestionCard's target/pendingQuestions setup has.
  const target = { kind: 'reference' as const, id: reference?.id ?? '' }

  const matchingPendingQuestions = storage.list.personal.questions().filter(
    (pending) => pending.target.kind === 'reference' && pending.target.id === reference?.id,
  )
  const pendingQuestionsFingerprint = JSON.stringify(matchingPendingQuestions)
  const pendingQuestions = useMemo(
    () => JSON.parse(pendingQuestionsFingerprint) as PendingQuestion[],
    [pendingQuestionsFingerprint],
  )

  if (!reference) {
    return null
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="reference-modal__content" showCloseButton={false}>
        <div className="reference-modal__header">
          <span className="reference-modal__eyebrow">{t('reference.eyebrow')}</span>
          <BookmarkButton topic={topic} target={target} onToggle={onPersonalLayerChange} />
          <DialogClose className="reference-modal__close" aria-label={t('reference.close')}>
            <CloseIcon size={16} />
          </DialogClose>
        </div>
        <DialogTitle className="reference-modal__term">{reference.term}</DialogTitle>
        <div className="reference-modal__answer" ref={answerRef}>
          <AnswerBody text={reference.text.value} references={[]} onReferenceSelect={() => {}} />
          <SelectionPlusButton containerRef={answerRef} topic={topic} target={target} onSaved={onPersonalLayerChange} />
          <PendingHighlight containerRef={answerRef} pendingQuestions={pendingQuestions} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
