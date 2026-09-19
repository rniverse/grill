import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { contentCache } from '@/services/content-cache'
import type { FileMeta, Question, Reference } from '@/types/topic.types'
import type { Bookmark, LocalTargetRef } from '@/types/personal.types'
import { storage } from '@/services/storage'
import { t } from '@/utils/i18n'
import { CollapsibleSection } from '@/components/CollapsibleSection/CollapsibleSection'
import { TopicChip } from '@/components/TopicChip/TopicChip'
import { ReferenceModal } from '@/components/ReferenceModal/ReferenceModal'
import { ListLoading } from '@/components/ListLoading/ListLoading'
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
              <span className="bookmarks-page__item-label">{label}</span>
              <TopicChip>{bookmark.topic.name}</TopicChip>
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
              <span className="bookmarks-page__item-label">{label}</span>
              <TopicChip>{bookmark.topic.name}</TopicChip>
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
            <span className="bookmarks-page__item-label">{label}</span>
            <TopicChip>{bookmark.topic.name}</TopicChip>
          </Link>
        )
      })}
    </>
  )
}

export function BookmarksPage() {
  const [loadedTopics, setLoadedTopics] = useState<LoadedTopicSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [openReference, setOpenReference] = useState<Reference | null>(null)
  const [openReferenceTopic, setOpenReferenceTopic] = useState<LoadedTopicSummary | null>(null)
  // Bumped whenever the reference modal's bookmark button changes something,
  // so the list behind it re-reads storage and reflects it.
  const [, bumpPersonalVersion] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadNeededTopics() {
      const sources = storage.list.sources()

      // Only the (topic, kind) pairs an actual bookmark needs get fetched —
      // never every configured source, and never both kinds for a topic
      // that only has one kind bookmarked.
      const neededKinds = new Map<string, Set<'question' | 'reference'>>()
      for (const bookmark of storage.list.personal.bookmarks()) {
        const kinds = neededKinds.get(bookmark.topic.name) ?? new Set()
        kinds.add(bookmark.target.kind)
        neededKinds.set(bookmark.topic.name, kinds)
      }

      const results = await Promise.all(
        Array.from(neededKinds.entries()).map(async ([topicName, kinds]) => {
          const source = sources.find((candidate) => candidate.name === topicName)
          if (!source) return null

          const [topicResult, referencesResult] = await Promise.all([
            kinds.has('question') ? contentCache.resolve.topic(source) : null,
            kinds.has('reference') ? contentCache.resolve.references(source) : null,
          ])
          if (topicResult?.status === 'error' || referencesResult?.status === 'error') return null

          // At least one of the two ran an 'ok' fetch — kinds is never
          // empty, and an 'error' result already returned above.
          const meta = topicResult?.status === 'ok' ? topicResult.data.meta : referencesResult?.status === 'ok' ? referencesResult.data.meta : undefined
          if (!meta) return null

          return {
            id: source.id,
            name: source.name,
            meta,
            questions: topicResult?.status === 'ok' ? topicResult.data.questions : [],
            references: referencesResult?.status === 'ok' ? referencesResult.data.references : [],
          }
        }),
      )
      const summaries = results.filter((summary) => summary !== null)
      if (!cancelled) {
        setLoadedTopics(summaries)
        setLoading(false)
      }
    }

    loadNeededTopics()
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
      <div className="bookmarks-page__content">
        <div className="bookmarks-page__card">
          <h1 className="bookmarks-page__title">{t('page.bookmarks.title')}</h1>
          <div className="bookmarks-page__sections">
            {loading ? (
              <ListLoading />
            ) : (
              <>
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
              </>
            )}
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
