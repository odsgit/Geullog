import { forwardRef, useImperativeHandle } from 'react'
import { useEditor, EditorContent, type Editor, type JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

interface RichTextEditorProps {
  content: string
}

export interface RichTextEditorHandle {
  editor: Editor | null
  getText: () => string
  getJSON: () => JSONContent
  setContent: (text: string) => void
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  ({ content }, ref) => {
    const editor = useEditor({
      extensions: [StarterKit],
      content,
    })

    useImperativeHandle(
      ref,
      () => ({
        editor,
        getText: () => editor?.getText() ?? '',
        getJSON: () => editor?.getJSON() ?? { type: 'doc', content: [] },
        setContent: (text: string) => editor?.commands.setContent(text),
      }),
      [editor],
    )

    return (
      <div className="rounded-xl border-[3px] border-black bg-white">
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none p-4 [&_.ProseMirror]:min-h-32 [&_.ProseMirror]:outline-none"
        />
      </div>
    )
  },
)

RichTextEditor.displayName = 'RichTextEditor'
