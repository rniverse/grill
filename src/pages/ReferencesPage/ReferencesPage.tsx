import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { contentCache } from '@/services/content-cache'
import { storage } from '@/services/storage'
import type { FileMeta, Reference } from '@/types/topic.types'
import { t } from '@/utils/i18n'
import { ReloadIcon } from '@/utils/icons'
import { TopicRow } from '@/components/TopicRow/TopicRow'
import { ReferenceModal } from '@/components/ReferenceModal/ReferenceModal'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import './ReferencesPage.css'

export function ReferencesPage() {
  const { topicId } = useParams<{ topicId: string }>()
  return topicId ? <TopicReferences topicId={topicId} /> : <ReferencesPicker />
}

function ReferencesPicker() {
  // Names only, from local storage — no fetch here. A topic's real reference
  // content is only fetched once the user opens it. A source with no
  // references URL configured has nothing to show here.
  const sources = storage.list.sources().filter((source) => source.source.references)

  return (
    <div className="references-page">
      <div className="references-page__content">
        <div className="references-page__card">
          <h1 className="references-page__label">{t('page.references.title')}</h1>
          <div className="references-page__rows">
            {sources.map((source, index) => (
              <TopicRow
                key={source.id}
                ordinal={String(index + 1).padStart(2, '0')}
                topicId={source.id}
                name={source.name}
                to={`/references/${source.id}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function TopicReferences({ topicId }: { topicId: string }) {
  const [meta, setMeta] = useState<FileMeta | null>(null)
  const [references, setReferences] = useState<Reference[]>([])
  const [notFound, setNotFound] = useState(false)
  const [openReference, setOpenReference] = useState<Reference | null>(null)
  // Bumped whenever a personal-layer mutation (ask/bookmark) happens inside
  // the reference modal, so pending-question highlights there re-read
  // storage and reflect it. Never rendered itself.
  const [, bumpPersonalVersion] = useState(0)
  const onPersonalLayerChange = () => bumpPersonalVersion((version) => version + 1)
  const [reloading, setReloading] = useState(false)

  // The name is already in local storage — this page never needs the topic
  // (questions) file, only the references file for this slug. Re-read on
  // every render for JSX use below (cheap, synchronous); the effect below
  // does its own lookup rather than depending on this value, since
  // storage.list.sources() returns a fresh array/object identity each call
  // and using it as a dependency would re-run the effect every render.
  const source = storage.list.sources().find((row) => row.id === topicId)

  useEffect(() => {
    let cancelled = false
    setNotFound(false)
    setMeta(null)
    setReferences([])
    setOpenReference(null)

    const source = storage.list.sources().find((row) => row.id === topicId)
    if (!source) {
      setNotFound(true)
      return
    }

    async function loadReferences() {
      // source is narrowed non-null above, but that narrowing doesn't reach
      // into this nested function's closure — TS can't see across it.
      // biome-ignore lint/style/noNonNullAssertion: narrowed above; see comment
      const result = await contentCache.resolve.references(source!)
      if (cancelled) {
        return
      }
      if (result.status === 'error') {
        setNotFound(true)
        return
      }
      setMeta(result.data.meta)
      setReferences(result.data.references)
    }

    loadReferences()

    return () => {
      cancelled = true
    }
  }, [topicId])

  async function handleReload() {
    if (!source) return
    setReloading(true)
    try {
      const result = await contentCache.resolve.references(source, { force: true })
      if (result.status === 'error') {
        setNotFound(true)
        return
      }
      setMeta(result.data.meta)
      setReferences(result.data.references)
    } finally {
      setReloading(false)
    }
  }

  if (notFound) {
    return (
      <div className="references-page">
        <div className="references-page__not-found">
          <p>{t('error.notfound.references')}</p>
          <Link to="/references">{t('backto.references')}</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="references-page">
      <div className="references-page__content">
        {source ? (
          <div className="references-page__card">
            <div className="references-page__header">
              <h1 className="references-page__title">{source.name}</h1>
              <span className="references-page__count">
                {t('references.term.count', { count: references.length })}
              </span>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      className="references-page__reload"
                      aria-label={t('reload.references')}
                      onClick={handleReload}
                      disabled={reloading}
                    />
                  }
                >
                  <ReloadIcon size={14} className={reloading ? 'icon-spin' : undefined} />
                </TooltipTrigger>
                <TooltipContent>{t('reload.references')}</TooltipContent>
              </Tooltip>
            </div>
            <div className="references-page__chips">
              {references.map((reference) => (
                <button
                  key={reference.id}
                  type="button"
                  className="references-page__chip"
                  onClick={() => setOpenReference(reference)}
                >
                  {reference.term}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      {source && meta ? (
        <ReferenceModal
          reference={openReference}
          topic={{ name: source.name, version: meta.version }}
          onClose={() => setOpenReference(null)}
          onPersonalLayerChange={onPersonalLayerChange}
        />
      ) : null}
    </div>
  )
}
