import { useState } from 'react'
import type { ID } from '@/types/topic.types'
import { isBookmarked, toggleBookmark } from '@/services/storage'
import { t } from '@/utils/i18n'
import { BookmarkedIcon, BookmarksIcon } from '@/utils/icons'
import './BookmarkButton.css'

export interface BookmarkButtonProps {
  topic: { name: string; version: string }
  target: { kind: 'question' | 'reference'; id: ID }
  onToggle?: () => void
}

export function BookmarkButton({ topic, target, onToggle }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(() => isBookmarked(target))
  const Icon = bookmarked ? BookmarkedIcon : BookmarksIcon

  return (
    <button
      type="button"
      className="bookmark-button"
      aria-pressed={bookmarked}
      aria-label={bookmarked ? t('personal.bookmark.added') : t('personal.bookmark.title')}
      onClick={(event) => {
        event.stopPropagation()
        toggleBookmark(target, topic)
        setBookmarked(!bookmarked)
        onToggle?.()
      }}
    >
      <Icon size={15} />
    </button>
  )
}
