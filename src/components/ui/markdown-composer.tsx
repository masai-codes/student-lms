import * as React from 'react'
import MDEditor, {
  bold,
  italic,
  strikethrough,
  link,
  orderedListCommand,
  unorderedListCommand,
  code,
  codeBlock,
  image,
} from '@uiw/react-md-editor'

import { cn } from '@/lib/utils'
import { toast } from '@/lib/toast'

/**
 * Toolbar matches the old LMS ticket editor (experience-ui
 * `MarkDownComponent/MarkdownEditor.tsx`): bold, italic, strikethrough, link,
 * ordered list, unordered list, inline code, code block, image.
 */
const commands = [
  bold,
  italic,
  strikethrough,
  link,
  orderedListCommand,
  unorderedListCommand,
  code,
  codeBlock,
  image,
]

const WORD_LIMIT = 500

/**
 * MarkdownComposer — markdown editor for the support ticket flow.
 *
 * Built on `@uiw/react-md-editor` to mirror the old LMS "Raise a Ticket"
 * editor UI (edit-only markdown pane + markdown toolbar). Emits plain markdown
 * via `onChange`, so the support API and `SupportMarkdown` renderer stay
 * unchanged. Props are kept identical to the previous implementation so
 * callers (TicketConversationPanel / CreateTicketModal) don't need changes.
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
  const height = Math.max(rows * 38, 100)

  // MDEditor needs `window`; render it only after mount to stay SSR-safe.
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const handleChange = (next?: string) => {
    const wordCount = next
      ? next.split(/\s+/).filter((w) => w.length > 0).length
      : 0
    if (wordCount > WORD_LIMIT) {
      toast.error(
        `Word limit exceeded! You can only enter up to ${WORD_LIMIT} words.`,
      )
      return
    }
    onChange(next ?? '')
  }

  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-xl border border-border bg-surface',
        className,
      )}
      data-color-mode="light"
    >
      {mounted ? (
        <MDEditor
          value={value}
          onChange={handleChange}
          preview="edit"
          highlightEnable={false}
          autoFocus={false}
          height={height}
          visibleDragbar={false}
          commands={commands}
          textareaProps={{ placeholder: placeholder ?? 'Type message here' }}
          style={{ borderRadius: 0, border: 'none', boxShadow: 'none' }}
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder ?? 'Type message here'}
          style={{ height }}
          className="w-full resize-none p-3 font-poppins text-[14px] text-foreground outline-none"
        />
      )}
    </div>
  )
}
