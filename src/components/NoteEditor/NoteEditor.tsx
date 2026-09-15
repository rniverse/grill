import { useEffect, useRef, useState } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, lineNumbers, placeholder as placeholderExtension } from '@codemirror/view'
import { markdown } from '@codemirror/lang-markdown'
import { basicSetup } from 'codemirror'
import { t } from '@/utils/i18n'
import './NoteEditor.css'

export interface NoteEditorProps {
  initialValue: string
  onSave: (text: string) => void
  onCancel: () => void
}

// Bare CodeMirror, not a full markdown editor library: it tokenizes for
// syntax highlighting only and never rewrites the underlying text, so
// what's typed is exactly what's saved (a rich-text/source-mode editor
// library was tried first and silently rewrote `-` bullets to `*` — see
// NoteEditor.test.tsx). Callers still render the saved text through
// AnswerBody/markdown when displaying it; only the editing surface stays
// literal.
export function NoteEditor({ initialValue, onSave, onCancel }: NoteEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const [text, setText] = useState(initialValue)
  const trimmedText = text.trim()

  // biome-ignore lint/correctness/useExhaustiveDependencies: mounts once with initialValue as the seed doc, see comment below
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const view = new EditorView({
      parent: container,
      state: EditorState.create({
        doc: initialValue,
        extensions: [
          basicSetup,
          lineNumbers(),
          markdown(),
          EditorView.lineWrapping,
          placeholderExtension(t('personal.note.placeholder')),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              setText(update.state.doc.toString())
            }
          }),
        ],
      }),
    })
    view.focus()
    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
    // Mounts once with initialValue as the seed doc, not a controlled prop —
    // reacting to it (or to a fresh t()/EditorState instance) on every
    // render would tear down and rebuild CodeMirror, losing cursor position.
  }, [])

  return (
    <div className="note-editor">
      <div className="note-editor__content" ref={containerRef} />
      <div className="note-editor__actions">
        <button type="button" className="note-editor__cancel" onClick={onCancel}>
          {t('personal.note.cancel')}
        </button>
        <button
          type="button"
          className="note-editor__save"
          disabled={trimmedText.length === 0}
          onClick={() => onSave(viewRef.current?.state.doc.toString() ?? text)}
        >
          {t('personal.note.save')}
        </button>
      </div>
    </div>
  )
}
