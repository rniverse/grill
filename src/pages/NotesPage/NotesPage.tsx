import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { personalNoteHasTarget, type LocalTargetRef, type PersonalNote } from '@/types/personal.types'
import { storage } from '@/services/storage'
import { contentCache } from '@/services/content-cache'
import { t } from '@/utils/i18n'
import { IconRail } from '@/components/IconRail/IconRail'
import { MobileNav } from '@/components/MobileNav/MobileNav'
import { NoteEditor } from '@/components/NoteEditor/NoteEditor'
import { TopicChip } from '@/components/TopicChip/TopicChip'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { RemoveIcon } from '@/utils/icons'
import './NotesPage.css'

const NOTE_PREVIEW_LENGTH = 80

function notePreview(text: string): string {
  return text.length > NOTE_PREVIEW_LENGTH ? `${text.slice(0, NOTE_PREVIEW_LENGTH)}…` : text
}

function noteChipText(note: PersonalNote): string {
  if (!personalNoteHasTarget(note)) return t('personal.note.chip.standalone')
  const type = t(note.target.kind === 'question' ? 'personal.rail.badge.question' : 'personal.rail.badge.reference')
  return t('personal.note.chip.format', { topic: note.topic.name, type })
}

export function NotesPage() {
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  // Bumped after a create/delete, so the list re-reads storage and the
  // label-resolution effect below re-runs against the new set of notes.
  const [version, bumpVersion] = useState(0)
  // Note id -> resolved question/reference text, filled in progressively as
  // each lookup resolves. A note whose id has no entry here just doesn't
  // show a target label yet (or ever, if the lookup fails) — the topic+type
  // chip alone is never blocked on this.
  const [targetLabels, setTargetLabels] = useState<Record<string, string>>({})

  const notes: PersonalNote[] = storage.list.personal.notes()

  // Only the specific kind each note actually needs gets fetched (topic file
  // for a question target, references file for a reference target) — never
  // both, and never for a standalone note. contentCache dedupes repeat
  // lookups against the same source, so two notes on the same topic cost one
  // fetch, not two.
  //
  // `version` is read only to retrigger this effect after a create/delete —
  // the body re-reads storage itself rather than closing over `notes`
  // directly, which would be a fresh array/object identity every render.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see comment above
  useEffect(() => {
    let cancelled = false

    async function resolveLabel(note: PersonalNote & { topic: LocalTargetRef['topic']; target: LocalTargetRef['target'] }) {
      const source = storage.list.sources().find((candidate) => candidate.name === note.topic.name)
      if (!source) return

      if (note.target.kind === 'question') {
        const result = await contentCache.resolve.topic(source)
        if (cancelled || result.status === 'error') return
        const label = result.data.questions.find((candidate) => candidate.id === note.target.id)?.question
        if (label) setTargetLabels((current) => ({ ...current, [note.id]: label }))
        return
      }

      const result = await contentCache.resolve.references(source)
      if (cancelled || result.status === 'error') return
      const label = result.data.references.find((candidate) => candidate.id === note.target.id)?.term
      if (label) setTargetLabels((current) => ({ ...current, [note.id]: label }))
    }

    for (const note of storage.list.personal.notes()) {
      if (personalNoteHasTarget(note)) resolveLabel(note)
    }

    return () => {
      cancelled = true
    }
  }, [version])

  return (
    <div className="notes-page">
      <IconRail />
      <div className="notes-page__content">
        <div className="notes-page__card">
          <div className="notes-page__mobile-header">
            <MobileNav />
          </div>
          <div className="notes-page__title-row">
            <h1 className="notes-page__title">{t('page.notes.title')}</h1>
            <button type="button" className="notes-page__add" onClick={() => setCreating(true)}>
              {t('personal.note.add')}
            </button>
          </div>
          <div className="notes-page__items">
            {notes.length === 0 ? (
              <p className="notes-page__empty">{t('personal.rail.empty.notes')}</p>
            ) : (
              notes.map((note) => (
                // A real <button> can't be used here — it contains its own
                // nested remove <button> below, and interactive elements
                // can't nest in valid HTML (same as PersonalRail's items).
                // biome-ignore lint/a11y/useSemanticElements: nested button, see comment
                <div
                  key={note.id}
                  className="notes-page__item"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/notes/${note.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      navigate(`/notes/${note.id}`)
                    }
                  }}
                >
                  <div className="notes-page__item-text">
                    {targetLabels[note.id] ? (
                      <span className="notes-page__item-target">{targetLabels[note.id]}</span>
                    ) : null}
                    <span className="notes-page__item-label">{notePreview(note.text)}</span>
                  </div>
                  <TopicChip>{noteChipText(note)}</TopicChip>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <button
                          type="button"
                          className="notes-page__item-remove"
                          aria-label={t('personal.note.delete')}
                          onClick={(event) => {
                            event.stopPropagation()
                            storage.delete.note(note.id)
                            bumpVersion((current) => current + 1)
                          }}
                        />
                      }
                    >
                      <RemoveIcon size={15} />
                    </TooltipTrigger>
                    <TooltipContent>{t('personal.note.delete')}</TooltipContent>
                  </Tooltip>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="notes-page__dialog" showCloseButton={false}>
          <DialogTitle className="notes-page__dialog-title">{t('personal.note.add')}</DialogTitle>
          <NoteEditor
            initialValue=""
            onSave={(text) => {
              storage.create.note(text)
              bumpVersion((current) => current + 1)
              setCreating(false)
            }}
            onCancel={() => setCreating(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
