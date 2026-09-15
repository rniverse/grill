import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { topicsConfig } from '@/topics.config'
import type { FileMeta, Question, Reference, Topic } from '@/types/topic.types'
import { t } from '@/utils/i18n'
import { isBookmarked } from '@/services/storage'
import { BookmarksIcon, ReferencesIcon, SearchIcon } from '@/utils/icons'
import { IconRail } from '@/components/IconRail/IconRail'
import { MobileNav } from '@/components/MobileNav/MobileNav'
import { FilterChips } from '@/components/FilterChips/FilterChips'
import { QuestionCard } from '@/components/QuestionCard/QuestionCard'
import { ReferenceModal } from '@/components/ReferenceModal/ReferenceModal'
import { MobileScreen } from './mobile-screen.enum'
import './TopicPage.css'

function collectTags(questions: Question[]): string[] {
  const filterAll = t('topic.filter.all')
  const tags: string[] = [filterAll]
  const seen = new Set<string>([filterAll])

  for (const question of questions) {
    for (const tag of question.tags ?? []) {
      if (!seen.has(tag)) {
        seen.add(tag)
        tags.push(tag)
      }
    }
  }

  return tags
}

export function TopicPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const [searchParams] = useSearchParams()
  const requestedQuestionId = searchParams.get('question')
  const [topic, setTopic] = useState<Topic | null>(null)
  const [meta, setMeta] = useState<FileMeta | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [references, setReferences] = useState<Reference[]>([])
  const [notFound, setNotFound] = useState(false)
  const [activeFilter, setActiveFilter] = useState(() => t('topic.filter.all'))
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null)
  const [openReference, setOpenReference] = useState<Reference | null>(null)
  // Mobile-only UI toggles (the controls that drive these are CSS-hidden
  // above --bp-mobile, so neither ever changes at desktop widths).
  const [mobileScreen, setMobileScreen] = useState<MobileScreen>(MobileScreen.Questions)
  const [bookmarkFilter, setBookmarkFilter] = useState(false)
  // Bumped whenever a personal-layer mutation (ask/bookmark/note) happens
  // somewhere below, so the bookmark filter and pending-question highlights
  // re-read storage and reflect it. Never rendered itself.
  const [, bumpPersonalVersion] = useState(0)
  const onPersonalLayerChange = () => bumpPersonalVersion((version) => version + 1)

  // requestedQuestionId deliberately excluded from deps below — this should
  // only act once, when the topic itself loads, not re-fire on every
  // URL/param change.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see comment above
  useEffect(() => {
    let cancelled = false
    setNotFound(false)
    setActiveFilter(t('topic.filter.all'))
    setOpenQuestionId(null)
    setMobileScreen(MobileScreen.Questions)
    setBookmarkFilter(false)

    const entry = topicsConfig.find((config) => config.id === topicId)
    if (!entry) {
      setNotFound(true)
      return
    }

    async function loadTopic() {
      // entry is narrowed non-null above, but that narrowing doesn't reach
      // into this nested function's closure — TS can't see across it.
      // biome-ignore lint/style/noNonNullAssertion: narrowed above; see comment
      const [topicModule, referencesModule] = await Promise.all([entry!.load.topics(), entry!.load.references()])
      if (cancelled) {
        return
      }
      setTopic(topicModule.topic)
      setMeta(topicModule.meta)
      setQuestions(topicModule.questions)
      setReferences(referencesModule.references)

      // Deep-link support (e.g. from a bookmark): open the question the URL
      // named, if it still exists in this topic.
      if (requestedQuestionId && topicModule.questions.some((question) => question.id === requestedQuestionId)) {
        setOpenQuestionId(requestedQuestionId)
      }
    }

    loadTopic()

    return () => {
      cancelled = true
    }
  }, [topicId])

  if (notFound) {
    return (
      <div className="topic-page">
        <IconRail />
        <div className="topic-page__not-found">
          <p>{t('error.notfound.topics')}</p>
          <Link to="/">{t('backto.topics')}</Link>
        </div>
      </div>
    )
  }

  const visibleQuestions = bookmarkFilter
    ? questions.filter((question) => isBookmarked({ kind: 'question', id: question.id }))
    : questions.filter(
        (question) => activeFilter === t('topic.filter.all') || (question.tags ?? []).includes(activeFilter),
      )

  function selectFilter(tag: string) {
    setActiveFilter(tag)
    setBookmarkFilter(false)
  }

  function toggleReferencesScreen() {
    setMobileScreen(mobileScreen === MobileScreen.References ? MobileScreen.Questions : MobileScreen.References)
  }

  function toggleBookmarkFilter() {
    setBookmarkFilter((current) => !current)
    setMobileScreen(MobileScreen.Questions)
  }

  return (
    <div className="topic-page">
      <IconRail />
      <main className="topic-page__main">
        {topic && meta ? (
          <div className="topic-page__content">
            <div className="topic-page__header">
              <div className="topic-page__title-row">
                <h1 className="topic-page__title">{topic.name}</h1>
              </div>
              <div className="topic-page__mobile-header">
                <div className="topic-page__mobile-header-left">
                  <MobileNav />
                  <div className="topic-page__mobile-title-group">
                    <h1 className="topic-page__mobile-title">{topic.name}</h1>
                    <span className="topic-page__mobile-meta">
                      {t('topic.mobile.meta', { version: meta.version, count: questions.length })}
                    </span>
                  </div>
                </div>
                <div className="topic-page__mobile-actions">
                  <button
                    type="button"
                    className="topic-page__mobile-icon-button"
                    aria-pressed={mobileScreen === MobileScreen.References}
                    aria-label={t('topic.mobile.toggle.references')}
                    onClick={toggleReferencesScreen}
                  >
                    <ReferencesIcon size={16} />
                  </button>
                  <button
                    type="button"
                    className="topic-page__mobile-icon-button"
                    aria-pressed={bookmarkFilter}
                    aria-label={t('topic.mobile.toggle.bookmarks')}
                    onClick={toggleBookmarkFilter}
                  >
                    <BookmarksIcon size={16} />
                  </button>
                  <button type="button" className="topic-page__mobile-icon-button" aria-label={t('landing.search')}>
                    <SearchIcon size={16} />
                  </button>
                </div>
              </div>
            </div>
            {/* Both the mobile-references view and the question-list view are
                always mounted; CSS (not JSX) decides which is visible per
                breakpoint, so rotating past --bp-mobile while either mobile
                toggle is on can never strand the desktop layout. */}
            <div
              className={
                mobileScreen === MobileScreen.References
                  ? 'topic-page__mobile-references topic-page__mobile-references--active'
                  : 'topic-page__mobile-references'
              }
            >
              <span className="topic-page__mobile-references-heading">
                {t('topic.mobile.references.label', { count: references.length })}
              </span>
              <div className="topic-page__mobile-reference-chips">
                {references.map((reference) => (
                  <button
                    key={reference.id}
                    type="button"
                    className="topic-page__mobile-reference-chip"
                    onClick={() => setOpenReference(reference)}
                  >
                    {reference.term}
                  </button>
                ))}
              </div>
            </div>
            <div
              className={
                mobileScreen === MobileScreen.References
                  ? 'topic-page__filter-row topic-page__filter-row--hidden-mobile'
                  : 'topic-page__filter-row'
              }
            >
              <FilterChips
                tags={collectTags(questions)}
                active={bookmarkFilter ? '' : activeFilter}
                onSelect={selectFilter}
              />
              <button
                type="button"
                className="topic-page__saved-chip"
                aria-pressed={bookmarkFilter}
                onClick={toggleBookmarkFilter}
              >
                <BookmarksIcon size={13} />
                <span>{t('topic.save.label')}</span>
              </button>
            </div>
            <div
              className={
                mobileScreen === MobileScreen.References
                  ? 'topic-page__cards topic-page__cards--hidden-mobile'
                  : 'topic-page__cards'
              }
            >
              {visibleQuestions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  ordinal={String(index + 1).padStart(2, '0')}
                  question={question}
                  references={references}
                  topic={{ name: topic.name, version: meta.version }}
                  open={openQuestionId === question.id}
                  onToggle={() => setOpenQuestionId(openQuestionId === question.id ? null : question.id)}
                  onReferenceSelect={setOpenReference}
                  onPersonalLayerChange={onPersonalLayerChange}
                />
              ))}
            </div>
          </div>
        ) : null}
      </main>
      {topic && meta ? (
        <ReferenceModal
          reference={openReference}
          topic={{ name: topic.name, version: meta.version }}
          onClose={() => setOpenReference(null)}
          onPersonalLayerChange={onPersonalLayerChange}
        />
      ) : null}
    </div>
  )
}
