import type { Reference } from '@/types/topic.types'
import { t } from '@/utils/i18n'
import { AnswerBody } from '@/components/AnswerBody/AnswerBody'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import './ReferenceModal.css'

export interface ReferenceModalProps {
  reference: Reference | null
  onClose: () => void
}

export function ReferenceModal({ reference, onClose }: ReferenceModalProps) {
  if (!reference) {
    return null
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="reference-modal__content" showCloseButton={false}>
        <div className="reference-modal__header">
          <span className="reference-modal__eyebrow">{t('reference.eyebrow')}</span>
          <DialogClose className="reference-modal__close" aria-label={t('reference.close')}>
            ×
          </DialogClose>
        </div>
        <DialogTitle className="reference-modal__term">{reference.term}</DialogTitle>
        <AnswerBody text={reference.text} references={[]} onReferenceSelect={() => {}} />
      </DialogContent>
    </Dialog>
  )
}
