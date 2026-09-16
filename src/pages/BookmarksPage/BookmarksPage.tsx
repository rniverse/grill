import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { content } from '@/services/content'
import type { FileMeta, Question, Reference } from '@/types/topic.types'
import type { Bookmark, LocalTargetRef } from '@/types/personal.types'
import { storage } from '@/services/storage'
import { t } from '@/utils/i18n'
import { IconRail } from '@/components/IconRail/IconRail'
import { MobileNav } from '@/components/MobileNav/MobileNav'
import { CollapsibleSection } from '@/components/CollapsibleSection/CollapsibleSection'
import { TopicBadge } from '@/components/TopicBadge/TopicBadge'
import { ReferenceModal } from '@/components/ReferenceModal/ReferenceModal'
import './BookmarksPage.css'

interface LoadedTopicSummary {
  id: string
  name: string
  meta: FileMeta
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

function BookmarkItems({
  bookmarks,
  topicByName,
  onOpenReference,
}: {
  bookmarks: Bookmark[]
  topicByName: (name: string) => LoadedTopicSummary | undefined
  onOpenReference: (reference: Reference, topic: LoadedTopicSummary) => void
}) {
  if (bookmarks.length === 0) {
    return <p className="bookmarks-page__empty">{t('personal.rail.empty.bookmarks')}</p>
  }

  return (
    <>
      {bookmarks.map((bookmark) => {
        const topic = topicByName(bookmark.topic.name)
        const label = resolveTargetLabel(bookmark.target, topic)

        if (!topic) {
          return (
            <div key={bookmark.id} className="bookmarks-page__item bookmarks-page__item--static">
              <TopicBadge>{bookmark.topic.name}</TopicBadge>
              <span className="bookmarks-page__item-label">{label}</span>
            </div>
          )
        }

        // References open in place — the reference content lives right
        // here (already loaded), no need to leave the page for it.
        if (bookmark.target.kind === 'reference') {
          const reference = topic.references.find((candidate) => candidate.id === bookmark.target.id)
          return (
            <button
              key={bookmark.id}
              type="button"
              className="bookmarks-page__item"
              onClick={() => reference && onOpenReference(reference, topic)}
            >
              <TopicBadge>{bookmark.topic.name}</TopicBadge>
              <span className="bookmarks-page__item-label">{label}</span>
            </button>
          )
        }

        // Questions redirect to the topic page, opened to that question.
        return (
          <Link
            key={bookmark.id}
            to={`/topics/${topic.id}?question=${bookmark.target.id}`}
            className="bookmarks-page__item"
          >
            <TopicBadge>{bookmark.topic.name}</TopicBadge>
            <span className="bookmarks-page__item-label">{label}</span>
          </Link>
        )
      })}
    </>
  )
}

export function BookmarksPage() {
  const [loadedTopics, setLoadedTopics] = useState<LoadedTopicSummary[]>([])
  const [openReference, setOpenReference] = useState<Reference | null>(null)
  const [openReferenceTopic, setOpenReferenceTopic] = useState<LoadedTopicSummary | null>(null)
  // Bumped whenever the reference modal's bookmark button changes something,
  // so the list behind it re-reads storage and reflects it.
  const [, bumpPersonalVersion] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadAllTopics() {
      const results = await Promise.all(
        storage.list.sources().map(async (source) => {
          const [topicResult, referencesResult] = await Promise.all([
            content.load.topic(source),
            content.load.references(source),
          ])
          if (topicResult.status === 'error' || referencesResult.status === 'error') return null
          return {
            id: topicResult.data.topic.id,
            name: topicResult.data.topic.name,
            meta: topicResult.data.meta,
            questions: topicResult.data.questions,
            references: referencesResult.data.references,
          }
        }),
      )
      const summaries = results.filter((summary) => summary !== null)
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

  function openReferenceInTopic(reference: Reference, topic: LoadedTopicSummary) {
    setOpenReference(reference)
    setOpenReferenceTopic(topic)
  }

  const bookmarks: Bookmark[] = storage.list.personal.bookmarks()
  const questionBookmarks = bookmarks.filter((bookmark) => bookmark.target.kind === 'question')
  const referenceBookmarks = bookmarks.filter((bookmark) => bookmark.target.kind === 'reference')

  return (
    <div className="bookmarks-page">
      <IconRail />
      <div className="bookmarks-page__content">
        <div className="bookmarks-page__card">
          <div className="bookmarks-page__mobile-header">
            <MobileNav />
          </div>
          <h1 className="bookmarks-page__title">{t('page.bookmarks.title')}</h1>
          <div className="bookmarks-page__sections">
            <CollapsibleSection title={t('personal.rail.tab.questions')}>
              <BookmarkItems
                bookmarks={questionBookmarks}
                topicByName={topicByName}
                onOpenReference={openReferenceInTopic}
              />
            </CollapsibleSection>
            <CollapsibleSection title={t('nav.references')}>
              <BookmarkItems
                bookmarks={referenceBookmarks}
                topicByName={topicByName}
                onOpenReference={openReferenceInTopic}
              />
            </CollapsibleSection>
          </div>
        </div>
      </div>
      {openReferenceTopic ? (
        <ReferenceModal
          reference={openReference}
          topic={{ name: openReferenceTopic.name, version: openReferenceTopic.meta.version }}
          onClose={() => {
            setOpenReference(null)
            setOpenReferenceTopic(null)
          }}
          onPersonalLayerChange={() => bumpPersonalVersion((version) => version + 1)}
        />
      ) : null}
    </div>
  )
}
