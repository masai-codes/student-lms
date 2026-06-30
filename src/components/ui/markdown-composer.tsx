import * as React from 'react'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import {
  Code,
  Link as LinkIcon,
  ListBullets,
  ListNumbers,
  TextB,
  TextItalic,
  TextStrikethrough,
} from '@phosphor-icons/react'

import { cn } from '@/lib/utils'

/**
 * Convert Tiptap HTML → markdown so the API payload stays in the markdown
 * format the server expects. Handles the marks/nodes StarterKit produces.
 */
function htmlToMarkdown(html: string): string {
  if (typeof window === 'undefined' || !html) return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return nodeToMd(doc.body).replace(/\n{3,}/g, '\n\n').trim()
}

function nodeToMd(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ''
  if (node.nodeType !== Node.ELEMENT_NODE) return ''
  const el = node as Element
  const tag = el.tagName.toLowerCase()
  const inner = () => Array.from(el.childNodes).map(nodeToMd).join('')
  switch (tag) {
    case 'strong': return `**${inner()}**`
    case 'em': return `*${inner()}*`
    case 's': return `~~${inner()}~~`
    case 'code':
      return el.closest('pre') !== null ? String(el.textContent) : `\`${inner()}\``
    case 'pre': return `\`\`\`\n${inner()}\n\`\`\`\n\n`
    case 'a': return `[${inner()}](${el.getAttribute('href') ?? ''})`
    case 'p': return `${inner()}\n\n`
    case 'br': return '\n'
    case 'ul': return Array.from(el.children).map((li) => `- ${nodeToMd(li)}\n`).join('')
    case 'ol': return Array.from(el.children).map((li, i) => `${i + 1}. ${nodeToMd(li)}\n`).join('')
    case 'li': return inner()
    case 'h1': return `# ${inner()}\n\n`
    case 'h2': return `## ${inner()}\n\n`
    case 'h3': return `### ${inner()}\n\n`
    default: return inner()
  }
}

/**
 * MarkdownComposer — single-pane WYSIWYG composer built on Tiptap.
 *
 * Typing bold/italic shows formatted text immediately (no raw `**syntax**`).
 * The `onChange` callback emits plain markdown so the API and SupportMarkdown
 * renderer stay unchanged.
 */
export function MarkdownComposer({
  value,
  onChange,
  placeholder,
  rows = 3,
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  className?: string
}) {
  const minHeight = Math.max(rows * 38, 100)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
        },
      }),
    ],
    content: '<p></p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'outline-none p-3 font-poppins text-[14px] text-gray-800 break-words ' +
          '[&_strong]:font-bold [&_em]:italic [&_s]:line-through ' +
          '[&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded [&_code]:font-mono [&_code]:text-[13px] ' +
          '[&_pre]:bg-gray-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:font-mono ' +
          '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 ' +
          '[&_a]:text-blue-600 [&_a]:underline [&_p]:my-0',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.isEmpty ? '' : htmlToMarkdown(ed.getHTML()))
    },
  })

  // Reset editor when the parent clears the value (e.g. after successful send).
  React.useEffect(() => {
    if (!editor) return
    if (value === '' && !editor.isEmpty) {
      editor.commands.clearContent(false)
    }
  }, [editor, value])

  const state = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      isBold: ed?.isActive('bold') ?? false,
      isItalic: ed?.isActive('italic') ?? false,
      isStrike: ed?.isActive('strike') ?? false,
      isCode: ed?.isActive('code') ?? false,
      isBullet: ed?.isActive('bulletList') ?? false,
      isOrdered: ed?.isActive('orderedList') ?? false,
    }),
  })

  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 border-b border-gray-100 px-2 py-1">
        <ToolbarBtn
          label="Bold"
          active={state?.isBold ?? false}
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBold().run() }}
        >
          <TextB className="size-4" />
        </ToolbarBtn>
        <ToolbarBtn
          label="Italic"
          active={state?.isItalic ?? false}
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleItalic().run() }}
        >
          <TextItalic className="size-4" />
        </ToolbarBtn>
        <ToolbarBtn
          label="Strikethrough"
          active={state?.isStrike ?? false}
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleStrike().run() }}
        >
          <TextStrikethrough className="size-4" />
        </ToolbarBtn>
        <ToolbarBtn
          label="Inline code"
          active={state?.isCode ?? false}
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleCode().run() }}
        >
          <Code className="size-4" />
        </ToolbarBtn>
        <ToolbarBtn
          label="Bulleted list"
          active={state?.isBullet ?? false}
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBulletList().run() }}
        >
          <ListBullets className="size-4" />
        </ToolbarBtn>
        <ToolbarBtn
          label="Numbered list"
          active={state?.isOrdered ?? false}
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleOrderedList().run() }}
        >
          <ListNumbers className="size-4" />
        </ToolbarBtn>
        <ToolbarBtn
          label="Link"
          active={false}
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().setLink({ href: 'https://' }).run() }}
        >
          <LinkIcon className="size-4" />
        </ToolbarBtn>
      </div>

      {/* Editable area */}
      <div style={{ minHeight }}>
        {placeholder && editor?.isEmpty && (
          <p className="pointer-events-none absolute px-3 pt-3 font-poppins text-[14px] text-gray-400 select-none">
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

function ToolbarBtn({
  label,
  active,
  onMouseDown,
  children,
}: {
  label: string
  active: boolean
  onMouseDown: (e: React.MouseEvent) => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={onMouseDown}
      className={cn(
        'flex size-7 items-center justify-center rounded-md transition-colors',
        active
          ? 'bg-gray-200 text-gray-900'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
      )}
    >
      {children}
    </button>
  )
}
