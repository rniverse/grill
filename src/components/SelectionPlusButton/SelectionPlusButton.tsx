import { useEffect, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import type { ID } from '@/types/topic.types'
import type { TextSelection } from '@/types/personal.types'
import { savePendingQuestion } from '@/services/storage'
import { captureSelection } from '@/utils/text-selection'
import { t } from '@/utils/i18n'
import { AskIcon } from '@/utils/icons'
import { AskQuestionPopover } from '@/components/AskQuestionPopover/AskQuestionPopover'
import './SelectionPlusButton.css'

const SCREEN_MARGIN = 8
const POPOVER_WIDTH = 340
const POPOVER_HEIGHT = 220

function clamp(value: number, min: number, max: number): number {
  if (max <= min) return min
  return Math.min(Math.max(value, min), max)
}

interface PlusPosition {
  selection: TextSelection
  x: number
  y: number
}

export interface SelectionPlusButtonProps {
  containerRef: RefObject<HTMLElement | null>
  topic: { name: string; version: string }
  target: { kind: 'question' | 'reference'; id: ID }
  onSaved?: () => void
}

export function SelectionPlusButton({ containerRef, topic, target, onSaved }: SelectionPlusButtonProps) {
  const [plus, setPlus] = useState<PlusPosition | null>(null)
  const [asking, setAsking] = useState<PlusPosition | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    function handleMouseUp(event: MouseEvent) {
      // container is narrowed non-null above, but that narrowing doesn't
      // reach into this nested function's closure — TS can't see across it.
      // biome-ignore lint/style/noNonNullAssertion: narrowed above; see comment
      const selection = captureSelection(container!)
      if (!selection) {
        setPlus(null)
        return
      }
      const x = clamp(event.clientX + 10, SCREEN_MARGIN, window.innerWidth - SCREEN_MARGIN)
      const y = clamp(event.clientY - 14, SCREEN_MARGIN, window.innerHeight - SCREEN_MARGIN)
      setPlus({ selection, x, y })
    }

    container.addEventListener('mouseup', handleMouseUp)
    return () => container.removeEventListener('mouseup', handleMouseUp)
  }, [containerRef])

  if (asking) {
    // Portaled to document.body: a container inside a modal (e.g.
    // ReferenceModal) sits behind a `transform`, which turns this
    // fixed-positioned popover's viewport coordinates into coordinates
    // relative to that transformed ancestor instead — and the modal's own
    // `overflow-y: auto` would then clip it. Rendering at the document root
    // keeps the fixed positioning meant literally, regardless of container.
    return createPortal(
      <AskQuestionPopover
        quote={asking.selection.text}
        position={asking}
        onCancel={() => setAsking(null)}
        onSave={(askText) => {
          savePendingQuestion({ topic, target, selection: asking.selection, ask: askText })
          setAsking(null)
          onSaved?.()
        }}
      />,
      document.body,
    )
  }

  if (!plus) {
    return null
  }

  return createPortal(
    <button
      type="button"
      className="selection-plus-button"
      style={{
        left: clamp(plus.x, SCREEN_MARGIN, window.innerWidth - SCREEN_MARGIN),
        top: clamp(plus.y, SCREEN_MARGIN, window.innerHeight - SCREEN_MARGIN),
      }}
      aria-label={t('personal.ask.question')}
      onClick={() => {
        setAsking({
          selection: plus.selection,
          x: clamp(plus.x, SCREEN_MARGIN, window.innerWidth - POPOVER_WIDTH - SCREEN_MARGIN),
          y: clamp(plus.y, SCREEN_MARGIN, window.innerHeight - POPOVER_HEIGHT - SCREEN_MARGIN),
        })
        setPlus(null)
      }}
    >
      <AskIcon size={17} />
    </button>,
    document.body,
  )
}
