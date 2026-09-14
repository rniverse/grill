import { useState } from 'react'
import { t } from '@/utils/i18n'
import './AskQuestionPopover.css'

export interface AskQuestionPopoverProps {
  quote: string
  position: { x: number; y: number }
  onSave: (askText: string) => void
  onCancel: () => void
}

export function AskQuestionPopover({ quote, position, onSave, onCancel }: AskQuestionPopoverProps) {
  const [askText, setAskText] = useState('')
  const trimmedAskText = askText.trim()

  return (
    <div className="ask-question-popover" style={{ left: position.x, top: position.y }}>
      <p className="ask-question-popover__quote">{quote}</p>
      <textarea
        className="ask-question-popover__input"
        placeholder={t('personal.askPlaceholder')}
        value={askText}
        onChange={(event) => setAskText(event.target.value)}
        autoFocus
      />
      <div className="ask-question-popover__actions">
        <button type="button" className="ask-question-popover__cancel" onClick={onCancel}>
          {t('personal.askCancel')}
        </button>
        <button
          type="button"
          className="ask-question-popover__save"
          disabled={trimmedAskText.length === 0}
          onClick={() => onSave(trimmedAskText)}
        >
          {t('personal.askSave')}
        </button>
      </div>
    </div>
  )
}
