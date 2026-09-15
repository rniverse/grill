import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { topicsConfig } from '@/topics.config'
import { listBookmarks, listPendingQuestions, listPersonalNotes } from '@/services/storage'
import { downloadPersonalLayer } from '@/utils/download-personal-layer'
import { t } from '@/utils/i18n'
import {
  BookmarksIcon,
  CloseIcon,
  ExportIcon,
  LogoIcon,
  MenuIcon,
  NotesIcon,
  QuestionsIcon,
  ReferencesIcon,
} from '@/utils/icons'
import './MobileNav.css'

interface LoadedTopicSummary {
  id: string
  name: string
  questionCount: number
}

export interface MobileNavProps {
  activeTopicId?: string
}

// The "Yours" rows are summary counts, not deep links: unlike Topics (which
// maps directly to an existing /topics/:id route), there's no dedicated
// screen yet for a cross-topic bookmarks/questions/notes list, so these just
// close the drawer. FlyoutPanel (desktop) already covers that cross-topic
// view; wiring an equivalent mobile screen is follow-up work.
export function MobileNav({ activeTopicId }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const [loadedTopics, setLoadedTopics] = useState<LoadedTopicSummary[]>([])
  const [totalReferences, setTotalReferences] = useState(0)

  useEffect(() => {
    if (!open) return
    let cancelled = false

    async function loadAllTopics() {
      const summaries: LoadedTopicSummary[] = []
      let referenceCount = 0
      for (const entry of topicsConfig) {
        const [topicModule, referencesModule] = await Promise.all([entry.load(), entry.loadReferences()])
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

  const yourItems = [
    { label: t('nav.references'), Icon: ReferencesIcon, count: totalReferences },
    { label: t('nav.bookmarks'), Icon: BookmarksIcon, count: listBookmarks().length },
    { label: t('nav.myQuestions'), Icon: QuestionsIcon, count: listPendingQuestions().length },
    { label: t('nav.myNotes'), Icon: NotesIcon, count: listPersonalNotes().length },
  ]

  return (
    <div className="mobile-nav">
      <button type="button" className="mobile-nav__trigger" aria-label={t('nav.menuOpen')} onClick={() => setOpen(true)}>
        <MenuIcon size={16} />
      </button>

      {open ? (
        <>
          <div className="mobile-nav__scrim" onClick={() => setOpen(false)} />
          <div className="mobile-nav__drawer">
            <div className="mobile-nav__brand">
              <span className="mobile-nav__brand-icon">
                <LogoIcon size={16} />
              </span>
              <span className="mobile-nav__brand-name">{t('nav.brand')}</span>
              <button
                type="button"
                className="mobile-nav__close"
                aria-label={t('nav.menuClose')}
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
              {yourItems.map(({ label, Icon, count }) => (
                <button key={label} type="button" className="mobile-nav__item" onClick={() => setOpen(false)}>
                  <Icon size={16} />
                  <span className="mobile-nav__item-label">{label}</span>
                  <span className="mobile-nav__item-count">{count}</span>
                </button>
              ))}
            </div>

            <button type="button" className="mobile-nav__export" onClick={downloadPersonalLayer}>
              <ExportIcon size={15} />
              <span>{t('nav.export')}</span>
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}
