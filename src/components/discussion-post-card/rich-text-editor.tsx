import * as React from 'react'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import { Bold, Italic, Link as LinkIcon, List, ListOrdered } from 'lucide-react'
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from '@/components/ui/modal'

/** Prefix a bare host (e.g. `masaischool.com`) with `https://`. */
function normalizeUrl(raw: string): string {
  const url = raw.trim()
  if (!url) return ''
  if (/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(url)) return url
  return `https://${url}`
}

type RichTextEditorProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  contentClassName?: string
  showToolbar?: boolean
  /** Flatter chrome for embedded composers (no outer editor border). */
  embedded?: boolean
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write here...',
  className = '',
  contentClassName = '',
  showToolbar = true,
  embedded = false,
}: RichTextEditorProps) {
  const contentBorderClass = embedded
    ? 'border-0'
    : showToolbar
      ? 'rounded-b-lg border border-t-0 border-border'
      : 'rounded-lg border border-border'

  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const editor = useEditor({
    extensions: [
      // StarterKit (v3) bundles the Link mark; disable open-on-click while
      // editing and force safe, new-tab attributes on saved links.
      StarterKit.configure({
        link: {
          openOnClick: false,
          HTMLAttributes: {
            rel: 'noopener noreferrer nofollow',
            target: '_blank',
          },
        },
      }),
    ],
    content: value || '<p></p>',
    editorProps: {
      attributes: {
        class: `min-h-24 ${contentBorderClass} px-3 py-2 text-[16px] leading-[22px] text-foreground outline-none break-words sm:text-[14px] [&_h1]:my-2 [&_h1]:text-[28px] [&_h1]:font-[700] [&_h1]:leading-[36px] [&_h2]:my-2 [&_h2]:text-[22px] [&_h2]:font-[600] [&_h2]:leading-[30px] [&_h3]:my-2 [&_h3]:text-[18px] [&_h3]:font-[600] [&_h3]:leading-[26px] [&_p]:my-0 [&_p+p]:mt-2 [&_a]:text-accent-warm [&_a]:underline [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 ${contentClassName}`,
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
      editor.commands.setContent(value || '<p></p>', { emitUpdate: false })
    }
  }, [editor, value])

  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => ({
      isBold: editor?.isActive('bold') ?? false,
      isItalic: editor?.isActive('italic') ?? false,
      isBulletList: editor?.isActive('bulletList') ?? false,
      isOrderedList: editor?.isActive('orderedList') ?? false,
      isLink: editor?.isActive('link') ?? false,
      isEmpty: editor?.isEmpty ?? true,
    }),
  })

  // Hyperlink modal state. We snapshot the selection context when it opens so
  // the form fields seed correctly even after focus moves into the dialog.
  const [linkModalOpen, setLinkModalOpen] = React.useState(false)
  const [linkUrl, setLinkUrl] = React.useState('')
  const [linkText, setLinkText] = React.useState('')
  // True when the cursor has no selection and isn't on an existing link, so the
  // modal asks for the display text to insert.
  const [linkNeedsText, setLinkNeedsText] = React.useState(false)
  const linkUrlInputRef = React.useRef<HTMLInputElement>(null)
  const isEditingLink = editorState?.isLink ?? false

  const openLinkModal = React.useCallback(() => {
    if (!editor) return
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, ' ')
    const onLink = editor.isActive('link')
    setLinkUrl((editor.getAttributes('link').href as string | undefined) ?? '')
    setLinkText(selectedText)
    setLinkNeedsText(!onLink && from === to)
    setLinkModalOpen(true)
  }, [editor])

  const removeLink = React.useCallback(() => {
    editor?.chain().focus().extendMarkRange('link').unsetLink().run()
    setLinkModalOpen(false)
  }, [editor])

  const applyLink = React.useCallback(() => {
    if (!editor) return
    const href = normalizeUrl(linkUrl)
    if (!href) {
      removeLink()
      return
    }
    if (linkNeedsText) {
      // No selection: insert the (typed) text as a single linked run.
      const text = linkText.trim() || href
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text,
          marks: [{ type: 'link', attrs: { href } }],
        })
        .run()
    } else {
      // Wrap the selected text / existing link with the href.
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
    }
    setLinkModalOpen(false)
  }, [editor, linkUrl, linkText, linkNeedsText, removeLink])

  const toolbarButtonClass = (isActive: boolean) =>
    `inline-flex items-center justify-center rounded-md border border-border transition-colors ${
      embedded ? 'h-7 w-7' : 'h-8 w-8'
    } ${
      isActive
        ? 'bg-[#FDE8D7] text-[#B45309] dark:bg-warning-subtle dark:text-warning-subtle-foreground'
        : 'text-foreground-muted hover:bg-surface-muted'
    }`

  const toolbarTopClass = embedded
    ? 'flex flex-wrap items-center gap-1 border-b border-border px-2 py-1.5'
    : 'flex flex-wrap items-center gap-2 rounded-t-lg border border-border p-2'

  const placeholderTopClass = showToolbar
    ? embedded
      ? 'top-[40px]'
      : 'top-[56px]'
    : 'top-[8px]'

  if (!isMounted || !editor) {
    return (
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`min-h-24 w-full resize-y rounded-lg border border-border px-3 py-2 text-[16px] leading-[22px] text-foreground outline-none placeholder:text-foreground-subtle sm:text-[14px] ${className}`}
      />
    )
  }

  return (
    <div className={`discussion-rich-editor relative ${className}`}>
      {showToolbar ? (
        <div className={toolbarTopClass}>
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
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={openLinkModal}
            className={toolbarButtonClass(editorState?.isLink ?? false)}
            aria-label="Add link"
          >
            <LinkIcon size={14} />
          </button>
        </div>
      ) : null}
      <EditorContent editor={editor} />
      {editorState?.isEmpty ? (
        <p
          className={`pointer-events-none absolute left-3 right-3 text-[16px] leading-[22px] text-foreground-subtle sm:text-[14px] ${placeholderTopClass}`}
        >
          {placeholder}
        </p>
      ) : null}

      <Modal open={linkModalOpen} onOpenChange={setLinkModalOpen}>
        <ModalContent
          className="max-w-md p-5 font-poppins"
          // Land focus on the URL field instead of the default close button.
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            linkUrlInputRef.current?.focus()
          }}
        >
          <ModalTitle className="text-[18px] font-bold text-foreground">
            {isEditingLink ? 'Edit link' : 'Add link'}
          </ModalTitle>
          <ModalDescription className="mt-1 text-[13px] text-foreground-muted">
            {linkNeedsText
              ? 'Add a link with the text you want to show.'
              : 'Link the selected text to a URL.'}
          </ModalDescription>

          <form
            className="mt-4 flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              applyLink()
            }}
          >
            {linkNeedsText ? (
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold text-foreground-muted">
                  Text to display
                </span>
                <input
                  type="text"
                  value={linkText}
                  onChange={(event) => setLinkText(event.target.value)}
                  placeholder="Register here"
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-[14px] text-foreground outline-none focus:border-accent-warm focus:ring-2 focus:ring-accent-warm/20"
                />
              </label>
            ) : null}
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-foreground-muted">
                Link URL
              </span>
              <input
                ref={linkUrlInputRef}
                type="text"
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                placeholder="https://masaischool.com"
                className="w-full rounded-lg border border-border px-3 py-2.5 text-[14px] text-foreground outline-none focus:border-accent-warm focus:ring-2 focus:ring-accent-warm/20"
              />
            </label>

            <div className="mt-1 flex items-center justify-between gap-3">
              {isEditingLink ? (
                <button
                  type="button"
                  onClick={removeLink}
                  className="text-[13px] font-semibold text-danger hover:underline"
                >
                  Remove link
                </button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLinkModalOpen(false)}
                  className="rounded-[10px] border border-border px-4 py-2 text-[13px] font-semibold text-foreground hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!linkUrl.trim()}
                  className="rounded-[10px] bg-accent-warm px-4 py-2 text-[13px] font-bold text-accent-warm-foreground transition-colors hover:bg-accent-warm-hover disabled:opacity-50"
                >
                  {isEditingLink ? 'Save' : 'Add link'}
                </button>
              </div>
            </div>
          </form>
        </ModalContent>
      </Modal>
    </div>
  )
}
