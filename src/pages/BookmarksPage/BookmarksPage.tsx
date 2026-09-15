import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { topicsConfig } from '@/topics.config'
import type { Question, Reference } from '@/types/topic.types'
import type { Bookmark, LocalTargetRef } from '@/types/personal.types'
import { listBookmarks } from '@/services/storage'
import { t } from '@/utils/i18n'
import { IconRail } from '@/components/IconRail/IconRail'
import { MobileNav } from '@/components/MobileNav/MobileNav'
import './BookmarksPage.css'

interface LoadedTopicSummary {
  id: string
  name: string
  questions: Question[]
  references: Reference[]
}

// Bookmarks are cross-topic, so resolving one to a label needs the topic it
// was made in, looked up by name (same approach FlyoutPanel used).
function resolveTargetLabel(target: LocalTargetRef['target'], topic: LoadedTopicSummary | undefined): string {
  if (!topic) return target.id
  if (target.kind === 'question') {
    return topic.questions.find((question) => question.id === target.id)?.question ?? target.id
  }
  return topic.references.find((reference) => reference.id === target.id)?.term ?? target.id
}

export function BookmarksPage() {
  const [loadedTopics, setLoadedTopics] = useState<LoadedTopicSummary[]>([])

  useEffect(() => {
    let cancelled = false

    async function loadAllTopics() {
      const summaries = await Promise.all(
        topicsConfig.map(async (entry) => {
          const [topicModule, referencesModule] = await Promise.all([entry.load(), entry.loadReferences()])
          return {
            id: topicModule.topic.id,
            name: topicModule.topic.name,
            questions: topicModule.questions,
            references: referencesModule.references,
          }
        }),
      )
      if (!cancelled) setLoadedTopics(summaries)
    }

    loadAllTopics()
    return () => {
      cancelled = true
    }
  }, [])

  function topicByName(name: string): LoadedTopicSummary | undefined {
    return loadedTopics.find((topic) => topic.name === name)
  }

  const bookmarks: Bookmark[] = listBookmarks()

  return (
    <div className="bookmarks-page">
      <IconRail />
      <div className="bookmarks-page__content">
        <div className="bookmarks-page__card">
          <div className="bookmarks-page__mobile-header">
            <MobileNav />
          </div>
          <h1 className="bookmarks-page__title">{t('page.bookmarks.title')}</h1>
          <div className="bookmarks-page__items">
            {bookmarks.length === 0 ? (
              <p className="bookmarks-page__empty">{t('personal.rail.empty.bookmarks')}</p>
            ) : (
              bookmarks.map((bookmark) => {
                const topic = topicByName(bookmark.topic.name)
                const label = resolveTargetLabel(bookmark.target, topic)
                return topic ? (
                  <Link key={bookmark.id} to={`/topics/${topic.id}`} className="bookmarks-page__item">
                    <span className="bookmarks-page__item-label">{label}</span>
                  </Link>
                ) : (
                  <div key={bookmark.id} className="bookmarks-page__item bookmarks-page__item--static">
                    <span className="bookmarks-page__item-label">{label}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
