import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { topicsConfig } from '@/topics.config'
import { storage } from '@/services/storage'
import { downloadPersonalLayer } from '@/utils/download-personal-layer'
import { t } from '@/utils/i18n'
import {
  BookmarksIcon,
  CloseIcon,
  ExportIcon,
  LogoIcon,
  MenuIcon,
  NotesIcon,
  PreferencesIcon,
  QuestionsIcon,
  ReferencesIcon,
} from '@/utils/icons'
import './MobileNav.css'

interface LoadedTopicSummary {
  id: string
  name: string
  questionCount: number
}

// activeTopicId isn't a prop: MobileNav is only ever rendered inside route
// components, so the router's own params already carry it (undefined on
// routes with no :topicId, same as before).
export function MobileNav() {
  const { topicId: activeTopicId } = useParams<{ topicId?: string }>()
  const [open, setOpen] = useState(false)
  const [loadedTopics, setLoadedTopics] = useState<LoadedTopicSummary[]>([])
  const [totalReferences, setTotalReferences] = useState(0)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const wasOpenRef = useRef(open)

  useEffect(() => {
    if (!open) return
    let cancelled = false

    async function loadAllTopics() {
      const summaries: LoadedTopicSummary[] = []
      let referenceCount = 0
      for (const entry of topicsConfig) {
        const [topicModule, referencesModule] = await Promise.all([entry.load.topics(), entry.load.references()])
        summaries.push({
          id: topicModule.topic.id,
          name: topicModule.topic.name,
          questionCount: topicModule.questions.length,
        })
        referenceCount += referencesModule.references.length
      }
      if (!cancelled) {
        setLoadedTopics(summaries)
        setTotalReferences(referenceCount)
      }
    }

    loadAllTopics()
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  // Return focus to the hamburger trigger whichever way the drawer closed
  // (Escape, scrim click, close button, or picking a topic/item) — a plain
  // "open just went false" transition covers all of those in one place.
  useEffect(() => {
    if (wasOpenRef.current && !open) {
      triggerRef.current?.focus()
    }
    wasOpenRef.current = open
  }, [open])

  const yourItems: { to: string; label: string; Icon: typeof ReferencesIcon; count?: number }[] = [
    { to: '/references', label: t('nav.references'), Icon: ReferencesIcon, count: totalReferences },
    { to: '/bookmarks', label: t('nav.bookmarks'), Icon: BookmarksIcon, count: storage.list.personal.bookmarks().length },
    { to: '/questions', label: t('nav.questions'), Icon: QuestionsIcon, count: storage.list.personal.questions().length },
    { to: '/notes', label: t('nav.notes'), Icon: NotesIcon, count: storage.list.personal.notes().length },
    { to: '/preferences', label: t('nav.preferences'), Icon: PreferencesIcon },
  ]

  return (
    <div className="mobile-nav">
      <button
        type="button"
        ref={triggerRef}
        className="mobile-nav__trigger"
        aria-label={t('nav.menu.open')}
        onClick={() => setOpen(true)}
      >
        <MenuIcon size={16} />
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="mobile-nav__scrim"
            aria-label={t('nav.menu.scrim')}
            onClick={() => setOpen(false)}
          />
          <div className="mobile-nav__drawer">
            <div className="mobile-nav__brand">
              <Link to="/" className="mobile-nav__brand-link" onClick={() => setOpen(false)}>
                <span className="mobile-nav__brand-icon">
                  <LogoIcon size={16} />
                </span>
                <span className="mobile-nav__brand-name">{t('nav.brand')}</span>
              </Link>
              <button
                type="button"
                className="mobile-nav__close"
                aria-label={t('nav.menu.close')}
                onClick={() => setOpen(false)}
              >
                <CloseIcon size={16} />
              </button>
            </div>

            <div className="mobile-nav__section">
              <span className="mobile-nav__section-label">{t('nav.topics')}</span>
              {loadedTopics.map((topicSummary) => (
                <Link
                  key={topicSummary.id}
                  to={`/topics/${topicSummary.id}`}
                  className="mobile-nav__topic"
                  aria-current={topicSummary.id === activeTopicId ? 'true' : undefined}
                  onClick={() => setOpen(false)}
                >
                  <span className="mobile-nav__topic-name">{topicSummary.name}</span>
                  <span className="mobile-nav__topic-count">{topicSummary.questionCount}</span>
                </Link>
              ))}
            </div>

            <div className="mobile-nav__section">
              <span className="mobile-nav__section-label">{t('nav.yours')}</span>
              {yourItems.map(({ to, label, Icon, count }) => (
                <Link key={to} to={to} className="mobile-nav__item" onClick={() => setOpen(false)}>
                  <Icon size={16} />
                  <span className="mobile-nav__item-label">{label}</span>
                  {count !== undefined ? <span className="mobile-nav__item-count">{count}</span> : null}
                </Link>
              ))}
            </div>

            <button type="button" className="mobile-nav__export" onClick={downloadPersonalLayer}>
              <ExportIcon size={15} />
              <span>{t('nav.export.label')}</span>
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}
