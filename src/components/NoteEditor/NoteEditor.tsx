import { useRef, useState } from 'react'
import {
  MDXEditor,
  type MDXEditorMethods,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'
import { t } from '@/utils/i18n'
import './NoteEditor.css'

export interface NoteEditorProps {
  initialValue: string
  onSave: (text: string) => void
  onCancel: () => void
}

// One-file wrapper around MDXEditor, matching how AnswerBody wraps
// react-markdown — consumers get initialValue/onSave/onCancel and never see
// MDXEditor's own plugin/ref API.
export function NoteEditor({ initialValue, onSave, onCancel }: NoteEditorProps) {
  const editorRef = useRef<MDXEditorMethods>(null)
  const [markdown, setMarkdown] = useState(initialValue)
  const trimmedMarkdown = markdown.trim()

  return (
    <div className="note-editor">
      <MDXEditor
        ref={editorRef}
        markdown={initialValue}
        onChange={setMarkdown}
        contentEditableClassName="note-editor__content"
        placeholder={t('personal.note.placeholder')}
        plugins={[headingsPlugin(), listsPlugin(), quotePlugin(), thematicBreakPlugin(), markdownShortcutPlugin()]}
      />
      <div className="note-editor__actions">
        <button type="button" className="note-editor__cancel" onClick={onCancel}>
          {t('personal.note.cancel')}
        </button>
        <button
          type="button"
          className="note-editor__save"
          disabled={trimmedMarkdown.length === 0}
          onClick={() => onSave(editorRef.current?.getMarkdown() ?? '')}
        >
          {t('personal.note.save')}
        </button>
      </div>
    </div>
  )
}
