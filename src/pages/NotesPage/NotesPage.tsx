import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { PersonalNote } from '@/types/personal.types'
import { deletePersonalNote, listPersonalNotes, savePersonalNote } from '@/services/storage'
import { t } from '@/utils/i18n'
import { IconRail } from '@/components/IconRail/IconRail'
import { MobileNav } from '@/components/MobileNav/MobileNav'
import { NoteEditor } from '@/components/NoteEditor/NoteEditor'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { RemoveIcon } from '@/utils/icons'
import './NotesPage.css'

const NOTE_PREVIEW_LENGTH = 80

function notePreview(text: string): string {
  return text.length > NOTE_PREVIEW_LENGTH ? `${text.slice(0, NOTE_PREVIEW_LENGTH)}…` : text
}

export function NotesPage() {
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  // Bumped after a create, so the list re-reads storage.
  const [, bumpVersion] = useState(0)

  const notes: PersonalNote[] = listPersonalNotes()

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
                  <span className="notes-page__item-label">{notePreview(note.text)}</span>
                  <button
                    type="button"
                    className="notes-page__item-remove"
                    aria-label={t('personal.note.delete')}
                    title={t('personal.note.delete')}
                    onClick={(event) => {
                      event.stopPropagation()
                      deletePersonalNote(note.id)
                      bumpVersion((version) => version + 1)
                    }}
                  >
                    <RemoveIcon size={15} />
                  </button>
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
              savePersonalNote(text)
              bumpVersion((version) => version + 1)
              setCreating(false)
            }}
            onCancel={() => setCreating(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
