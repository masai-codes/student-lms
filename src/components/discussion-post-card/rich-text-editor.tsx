"use client"

import * as React from "react"
import StarterKit from "@tiptap/starter-kit"
import { EditorContent, useEditor, useEditorState } from "@tiptap/react"
import {
  Bold,
  Italic,
  List,
  ListOrdered,
} from "lucide-react"

type RichTextEditorProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  contentClassName?: string
  showToolbar?: boolean
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write here...",
  className = "",
  contentClassName = "",
  showToolbar = true,
}: RichTextEditorProps) {
  const contentBorderClass = showToolbar
    ? "rounded-b-lg border border-t-0 border-[#D1D5DB]"
    : "rounded-lg border border-[#D1D5DB]"

  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        class:
          `min-h-24 ${contentBorderClass} px-3 py-2 text-[14px] leading-[22px] text-[#111928] outline-none [&_h1]:my-2 [&_h1]:text-[28px] [&_h1]:font-[700] [&_h1]:leading-[36px] [&_h2]:my-2 [&_h2]:text-[22px] [&_h2]:font-[600] [&_h2]:leading-[30px] [&_h3]:my-2 [&_h3]:text-[18px] [&_h3]:font-[600] [&_h3]:leading-[26px] [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_blockquote]:border-l-2 [&_blockquote]:border-[#E5E7EB] [&_blockquote]:pl-3 ${contentClassName}`,
      },
    },
    onUpdate: ({ editor: tiptapEditor }) => {
      onChange(tiptapEditor.getHTML())
    },
    immediatelyRender: false,
  })

  React.useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (current !== value) {
      editor.commands.setContent(value || "<p></p>", { emitUpdate: false })
    }
  }, [editor, value])

  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => ({
      isBold: editor?.isActive("bold") ?? false,
      isItalic: editor?.isActive("italic") ?? false,
      isBulletList: editor?.isActive("bulletList") ?? false,
      isOrderedList: editor?.isActive("orderedList") ?? false,
      isEmpty: editor?.isEmpty ?? true,
    }),
  })

  const toolbarButtonClass = (isActive: boolean) =>
    `inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#E5E7EB] transition-colors ${
      isActive
        ? "bg-[#FDE8D7] text-[#B45309]"
        : "text-[#4B5563] hover:bg-[#F9FAFB]"
    }`

  if (!isMounted || !editor) {
    return (
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`min-h-24 w-full resize-y rounded-lg border border-[#D1D5DB] px-3 py-2 text-[14px] leading-[22px] text-[#111928] outline-none placeholder:text-[#9CA3AF] ${className}`}
      />
    )
  }

  return (
    <div className={`discussion-rich-editor relative ${className}`}>
      {showToolbar ? (
        <div className="flex flex-wrap items-center gap-2 rounded-t-lg border border-[#D1D5DB] p-2">
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={toolbarButtonClass(editorState?.isBold ?? false)}
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={toolbarButtonClass(editorState?.isItalic ?? false)}
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={toolbarButtonClass(editorState?.isBulletList ?? false)}
        >
          <List size={14} />
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={toolbarButtonClass(editorState?.isOrderedList ?? false)}
        >
          <ListOrdered size={14} />
        </button>
        </div>
      ) : null}
      <EditorContent editor={editor} />
      {editorState?.isEmpty ? (
        <p
          className={`pointer-events-none absolute left-5 text-[14px] leading-[22px] text-[#9CA3AF] ${
            showToolbar ? "top-[56px]" : "top-4"
          }`}
        >
          {placeholder}
        </p>
      ) : null}
    </div>
  )
}
