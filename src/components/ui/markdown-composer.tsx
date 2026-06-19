import { useRef } from 'react'
import {
  Link as LinkIcon,
  ListBullets,
  ListNumbers,
  TextB,
  TextItalic,
} from '@phosphor-icons/react'

import { cn } from '@/lib/utils'

/**
 * MarkdownComposer — a lightweight markdown text editor: a textarea with a small
 * formatting toolbar (bold / italic / bullet / numbered / link) that inserts
 * markdown syntax around the current selection. Output is plain markdown, so it
 * round-trips with any markdown renderer.
 *
 * Reusable across modules (ticket replies, discussion posts, …); the caller owns
 * the value and submission.
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
  const ref = useRef<HTMLTextAreaElement>(null)

  /** Wrap the current selection with `before`/`after` (or insert a line prefix). */
  const apply = (kind: 'bold' | 'italic' | 'bullet' | 'numbered' | 'link') => {
    const el = ref.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = value.slice(start, end)

    let next = value
    let caret = end

    if (kind === 'bold' || kind === 'italic') {
      const mark = kind === 'bold' ? '**' : '*'
      const text = selected || (kind === 'bold' ? 'bold text' : 'italic text')
      next = value.slice(0, start) + mark + text + mark + value.slice(end)
      caret = start + mark.length + text.length + mark.length
    } else if (kind === 'link') {
      const text = selected || 'link text'
      const snippet = `[${text}](https://)`
      next = value.slice(0, start) + snippet + value.slice(end)
      caret = start + snippet.length
    } else {
      // Line-prefix list markers across the selected lines.
      const prefix = kind === 'bullet' ? '- ' : '1. '
      const block = selected || 'List item'
      const prefixed = block
        .split('\n')
        .map((line) => `${prefix}${line}`)
        .join('\n')
      next = value.slice(0, start) + prefixed + value.slice(end)
      caret = start + prefixed.length
    }

    onChange(next)
    // Restore focus + caret after React re-renders.
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(caret, caret)
    })
  }

  const ToolbarButton = ({
    label,
    onClick,
    children,
  }: {
    label: string
    onClick: () => void
    children: React.ReactNode
  }) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex size-7 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    >
      {children}
    </button>
  )

  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white', className)}>
      <div className="flex items-center gap-0.5 border-b border-gray-100 px-2 py-1">
        <ToolbarButton label="Bold" onClick={() => apply('bold')}>
          <TextB className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Italic" onClick={() => apply('italic')}>
          <TextItalic className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Bulleted list" onClick={() => apply('bullet')}>
          <ListBullets className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Numbered list" onClick={() => apply('numbered')}>
          <ListNumbers className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Link" onClick={() => apply('link')}>
          <LinkIcon className="size-4" />
        </ToolbarButton>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="font-poppins w-full resize-none rounded-b-xl bg-white p-3 text-[14px] text-gray-800 outline-none"
      />
    </div>
  )
}
