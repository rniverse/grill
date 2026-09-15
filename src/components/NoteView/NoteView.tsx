import { useState } from 'react'
import type { PersonalNote } from '@/types/personal.types'
import { t } from '@/utils/i18n'
import { AnswerBody } from '@/components/AnswerBody/AnswerBody'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import './NoteView.css'

const INLINE_WORD_LIMIT = 100
const INLINE_CHAR_LIMIT = 1000

function fitsInline(text: string): boolean {
  const wordCount = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length
  return wordCount <= INLINE_WORD_LIMIT && text.length <= INLINE_CHAR_LIMIT
}

export interface NoteViewProps {
  note: PersonalNote
}

// Renders a PersonalNote's markdown through AnswerBody — inline when short
// (rolling-spec section 4: <=100 words AND <=1000 characters), otherwise
// behind an expand button that opens the same Dialog pattern ReferenceModal
// established.
export function NoteView({ note }: NoteViewProps) {
  const [expanded, setExpanded] = useState(false)

  if (fitsInline(note.text)) {
    return (
      <div className="note-view">
        <AnswerBody text={note.text} references={[]} onReferenceSelect={() => {}} />
      </div>
    )
  }

  return (
    <div className="note-view">
      <button type="button" className="note-view__expand" onClick={() => setExpanded(true)}>
        {t('personal.note.expand')}
      </button>
      {expanded ? (
        <Dialog open onOpenChange={(open) => !open && setExpanded(false)}>
          <DialogContent className="note-view__content" showCloseButton={false}>
            <div className="note-view__header">
              <span className="note-view__eyebrow">{t('personal.note.eyebrow')}</span>
              <DialogClose className="note-view__close" aria-label={t('personal.note.close')}>
                ×
              </DialogClose>
            </div>
            <DialogTitle className="sr-only">{t('personal.note.eyebrow')}</DialogTitle>
            <AnswerBody text={note.text} references={[]} onReferenceSelect={() => {}} />
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  )
}
