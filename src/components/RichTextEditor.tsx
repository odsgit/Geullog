import { forwardRef, useImperativeHandle } from 'react'
import { useEditor, EditorContent, type Editor, type JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'

interface RichTextEditorProps {
  content: string
}

export interface RichTextEditorHandle {
  editor: Editor | null
  getText: () => string
  getJSON: () => JSONContent
  setContent: (text: string) => void
}

// content is markdown (## headings, blank-line paragraphs, - bullets) coming
// from the generation prompt's structure enforcement — the Markdown extension
// parses it into real heading/paragraph/list nodes instead of one flat blob.
export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  ({ content }, ref) => {
    const editor = useEditor({
      extensions: [StarterKit, Markdown],
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
      <div className="rounded-xl border border-line bg-white">
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none p-4 [&_.ProseMirror]:min-h-32 [&_.ProseMirror]:outline-none"
        />
      </div>
    )
  },
)

RichTextEditor.displayName = 'RichTextEditor'
