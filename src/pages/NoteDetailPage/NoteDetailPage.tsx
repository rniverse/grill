import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { contentCache } from '@/services/content-cache'
import type { FileMeta, Question, Reference } from '@/types/topic.types'
import { personalNoteHasTarget } from '@/types/personal.types'
import { storage } from '@/services/storage'
import { t } from '@/utils/i18n'
import { RemoveIcon } from '@/utils/icons'
import { IconRail } from '@/components/IconRail/IconRail'
import { MobileNav } from '@/components/MobileNav/MobileNav'
import { AnswerBody } from '@/components/AnswerBody/AnswerBody'
import { NoteEditor } from '@/components/NoteEditor/NoteEditor'
import { ReferenceModal } from '@/components/ReferenceModal/ReferenceModal'
import { TopicBadge } from '@/components/TopicBadge/TopicBadge'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import './NoteDetailPage.css'

interface LoadedTopicSummary {
  id: string
  name: string
  meta: FileMeta
  questions: Question[]
  references: Reference[]
}

// Only reached for a standalone note (no question/reference behind it) —
// NotesPage still opens the view dialog for a targeted one, since that one
// has somewhere else to "go to". A standalone note has nothing else
// attached, so it gets a real page instead of a dialog.
export function NoteDetailPage() {
  const { noteId } = useParams<{ noteId: string }>()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [loadedTopics, setLoadedTopics] = useState<LoadedTopicSummary[]>([])
  const [openReference, setOpenReference] = useState<Reference | null>(null)
  const [openReferenceTopic, setOpenReferenceTopic] = useState<LoadedTopicSummary | null>(null)
  // Bumped after an edit or a reference-modal bookmark change, so re-reading
  // storage below picks up the change.
  const [, bumpVersion] = useState(0)

  const note = storage.list.personal.notes().find((candidate) => candidate.id === noteId)

  // note is intentionally excluded from the deps below — it's re-derived
  // from storage every render (see above), so a new object identity each
  // time would re-run this effect every render. noteId is the real
  // trigger; a note's topic/target never change after creation (only its
  // text can, via Edit), so nothing else needs to retrigger this.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see comment above
  useEffect(() => {
    let cancelled = false

    async function loadNeededTopic() {
      if (!note || !personalNoteHasTarget(note)) return
      const source = storage.list.sources().find((candidate) => candidate.name === note.topic.name)
      if (!source) return

      // Only the one kind this note actually needs gets fetched — never
      // both, and never any other configured source.
      if (note.target.kind === 'question') {
        const result = await contentCache.resolve.topic(source)
        if (cancelled || result.status === 'error') return
        setLoadedTopics([{ id: result.data.topic.id, name: result.data.topic.name, meta: result.data.meta, questions: result.data.questions, references: [] }])
      } else {
        const result = await contentCache.resolve.references(source)
        if (cancelled || result.status === 'error') return
        setLoadedTopics([{ id: source.id, name: source.name, meta: result.data.meta, questions: [], references: result.data.references }])
      }
    }

    loadNeededTopic()
    return () => {
      cancelled = true
    }
  }, [noteId])

  function topicByName(name: string): LoadedTopicSummary | undefined {
    return loadedTopics.find((topic) => topic.name === name)
  }

  if (!note) {
    return (
      <div className="note-detail-page">
        <IconRail />
        <div className="note-detail-page__not-found">
          <p>{t('error.notfound.notes')}</p>
          <Link to="/notes">{t('backto.notes')}</Link>
        </div>
      </div>
    )
  }

  const topic = personalNoteHasTarget(note) ? topicByName(note.topic.name) : undefined
  const reference =
    topic && personalNoteHasTarget(note) && note.target.kind === 'reference'
      ? topic.references.find((candidate) => candidate.id === note.target.id)
      : undefined
  const targetLabel =
    topic && personalNoteHasTarget(note)
      ? note.target.kind === 'question'
        ? topic.questions.find((candidate) => candidate.id === note.target.id)?.question
        : reference?.term
      : undefined

  return (
    <div className="note-detail-page">
      <IconRail />
      <div className="note-detail-page__content">
        <div className="note-detail-page__card">
          <div className="note-detail-page__mobile-header">
            <MobileNav />
          </div>
          <div className="note-detail-page__toolbar">
            <Link to="/notes" className="note-detail-page__back">
              {t('backto.notes')}
            </Link>
            <div className="note-detail-page__actions">
              {topic && personalNoteHasTarget(note) ? (
                note.target.kind === 'question' ? (
                  <Link
                    to={`/topics/${topic.id}?question=${note.target.id}`}
                    className="note-detail-page__goto"
                  >
                    {t('personal.goto.question')}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="note-detail-page__goto"
                    onClick={() => {
                      if (reference) {
                        setOpenReference(reference)
                        setOpenReferenceTopic(topic)
                      }
                    }}
                  >
                    {t('personal.goto.question')}
                  </button>
                )
              ) : null}
              <button type="button" className="note-detail-page__edit" onClick={() => setEditing(true)}>
                {t('personal.note.edit')}
              </button>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      className="note-detail-page__remove"
                      aria-label={t('personal.note.delete')}
                      onClick={() => {
                        storage.delete.note(note.id)
                        navigate('/notes')
                      }}
                    />
                  }
                >
                  <RemoveIcon size={16} />
                </TooltipTrigger>
                <TooltipContent>{t('personal.note.delete')}</TooltipContent>
              </Tooltip>
            </div>
          </div>
          {topic && targetLabel ? (
            <div className="note-detail-page__meta">
              <TopicBadge>{topic.name}</TopicBadge>
              <p className="note-detail-page__target">{targetLabel}</p>
            </div>
          ) : null}
          <AnswerBody text={note.text} references={[]} onReferenceSelect={() => {}} />
        </div>
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="note-detail-page__dialog" showCloseButton={false}>
          <DialogTitle className="note-detail-page__dialog-title">{t('personal.note.edit')}</DialogTitle>
          <NoteEditor
            initialValue={note.text}
            onSave={(text) => {
              storage.update.note(note.id, text)
              bumpVersion((version) => version + 1)
              setEditing(false)
            }}
            onCancel={() => setEditing(false)}
          />
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
          onPersonalLayerChange={() => bumpVersion((version) => version + 1)}
        />
      ) : null}
    </div>
  )
}
