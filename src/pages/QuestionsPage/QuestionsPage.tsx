import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { contentCache } from '@/services/content-cache'
import type { FileMeta, Question, Reference } from '@/types/topic.types'
import type { LocalTargetRef, PendingQuestion } from '@/types/personal.types'
import { storage } from '@/services/storage'
import { t } from '@/utils/i18n'
import { IconRail } from '@/components/IconRail/IconRail'
import { MobileNav } from '@/components/MobileNav/MobileNav'
import { CollapsibleSection } from '@/components/CollapsibleSection/CollapsibleSection'
import { TopicBadge } from '@/components/TopicBadge/TopicBadge'
import { TopicChip } from '@/components/TopicChip/TopicChip'
import { ReferenceModal } from '@/components/ReferenceModal/ReferenceModal'
import { CloseIcon, RemoveIcon } from '@/utils/icons'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import './QuestionsPage.css'

interface LoadedTopicSummary {
  id: string
  name: string
  meta: FileMeta
  questions: Question[]
  references: Reference[]
}

// The term/question text this pending question was asked against — shown
// in the dialog so it's clear what the quote below is from.
function targetLabel(target: LocalTargetRef['target'], topic: LoadedTopicSummary | undefined): string {
  if (!topic) return target.id
  if (target.kind === 'question') {
    return topic.questions.find((question) => question.id === target.id)?.question ?? target.id
  }
  return topic.references.find((reference) => reference.id === target.id)?.term ?? target.id
}

function QuestionItems({
  pendingQuestions,
  emptyText,
  onSelect,
  topicByName,
}: {
  pendingQuestions: PendingQuestion[]
  emptyText: string
  onSelect: (pending: PendingQuestion) => void
  topicByName: (name: string) => LoadedTopicSummary | undefined
}) {
  if (pendingQuestions.length === 0) {
    return <p className="questions-page__empty">{emptyText}</p>
  }

  return (
    <>
      {pendingQuestions.map((pending) => {
        const topic = topicByName(pending.topic.name)
        return (
          <button
            key={pending.id}
            type="button"
            className="questions-page__item"
            onClick={() => onSelect(pending)}
          >
            <div className="questions-page__item-text">
              {topic ? (
                <span className="questions-page__item-target">{targetLabel(pending.target, topic)}</span>
              ) : null}
              <span className="questions-page__item-label">{pending.ask}</span>
            </div>
            <TopicChip>{pending.topic.name}</TopicChip>
          </button>
        )
      })}
    </>
  )
}

export function QuestionsPage() {
  const [loadedTopics, setLoadedTopics] = useState<LoadedTopicSummary[]>([])
  const [openPending, setOpenPending] = useState<PendingQuestion | null>(null)
  const [openReference, setOpenReference] = useState<Reference | null>(null)
  const [openReferenceTopic, setOpenReferenceTopic] = useState<LoadedTopicSummary | null>(null)
  // Bumped whenever a delete or the reference modal's bookmark button
  // changes something, so re-reading storage below picks up the change.
  const [, bumpPersonalVersion] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadNeededTopics() {
      const sources = storage.list.sources()

      // Only the (topic, kind) pairs an actual pending question needs get
      // fetched — never every configured source, and never both kinds for a
      // topic that only has one kind pending.
      const neededKinds = new Map<string, Set<'question' | 'reference'>>()
      for (const pending of storage.list.personal.questions()) {
        const kinds = neededKinds.get(pending.topic.name) ?? new Set()
        kinds.add(pending.target.kind)
        neededKinds.set(pending.topic.name, kinds)
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
      if (!cancelled) setLoadedTopics(summaries)
    }

    loadNeededTopics()
    return () => {
      cancelled = true
    }
  }, [])

  function topicByName(name: string): LoadedTopicSummary | undefined {
    return loadedTopics.find((topic) => topic.name === name)
  }

  function removePending(pending: PendingQuestion) {
    storage.delete.question(pending.id)
    bumpPersonalVersion((version) => version + 1)
    setOpenPending(null)
  }

  function goToPendingReference() {
    if (!openPending) return
    const topic = topicByName(openPending.topic.name)
    if (!topic) return

    const reference = topic.references.find((candidate) => candidate.id === openPending.target.id)
    if (reference) {
      setOpenReference(reference)
      setOpenReferenceTopic(topic)
    }
    setOpenPending(null)
  }

  const pendingQuestions: PendingQuestion[] = storage.list.personal.questions()
  const onQuestionTarget = pendingQuestions.filter((pending) => pending.target.kind === 'question')
  const onReferenceTarget = pendingQuestions.filter((pending) => pending.target.kind === 'reference')
  const openTopic = openPending ? topicByName(openPending.topic.name) : undefined

  return (
    <div className="questions-page">
      <IconRail />
      <div className="questions-page__content">
        <div className="questions-page__card">
          <div className="questions-page__mobile-header">
            <MobileNav />
          </div>
          <h1 className="questions-page__title">{t('page.questions.title')}</h1>
          <div className="questions-page__sections">
            <CollapsibleSection title={t('personal.rail.tab.questions')}>
              <QuestionItems
                pendingQuestions={onQuestionTarget}
                emptyText={t('personal.rail.empty.questions')}
                onSelect={setOpenPending}
                topicByName={topicByName}
              />
            </CollapsibleSection>
            <CollapsibleSection title={t('nav.references')}>
              <QuestionItems
                pendingQuestions={onReferenceTarget}
                emptyText={t('references.empty.questions')}
                onSelect={setOpenPending}
                topicByName={topicByName}
              />
            </CollapsibleSection>
          </div>
        </div>
      </div>
      <Dialog open={openPending !== null} onOpenChange={(open) => !open && setOpenPending(null)}>
        <DialogContent className="questions-page__dialog" showCloseButton={false}>
          {openPending ? (
            <>
              <div className="questions-page__dialog-header">
                <TopicBadge>{openPending.topic.name}</TopicBadge>
                <DialogClose className="questions-page__dialog-close" aria-label={t('reference.close')}>
                  <CloseIcon size={16} />
                </DialogClose>
              </div>
              <p className="questions-page__dialog-target">{targetLabel(openPending.target, openTopic)}</p>
              <p className="questions-page__dialog-quote">{openPending.selection.text}</p>
              <DialogTitle className="questions-page__dialog-ask">{openPending.ask}</DialogTitle>
              <div className="questions-page__dialog-actions">
                {openPending.target.kind === 'question' && openTopic ? (
                  <Link
                    to={`/topics/${openTopic.id}?question=${openPending.target.id}`}
                    className="questions-page__dialog-link"
                    onClick={() => setOpenPending(null)}
                  >
                    {t('personal.goto.question')}
                  </Link>
                ) : null}
                {openPending.target.kind === 'reference' ? (
                  <button type="button" className="questions-page__dialog-link" onClick={goToPendingReference}>
                    {t('personal.goto.reference')}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="questions-page__dialog-remove"
                  aria-label={t('personal.rail.remove')}
                  onClick={() => removePending(openPending)}
                >
                  <RemoveIcon size={16} />
                </button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
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
