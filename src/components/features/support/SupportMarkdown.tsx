import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'

import { cn } from '@/lib/utils'

/**
 * SupportMarkdown — safe, compact markdown renderer for FAQ answers and ticket
 * messages. GitHub-flavoured markdown, sanitised (no raw HTML injection), with
 * links opening in a new tab. Styled with `prose` for readable typography.
 *
 * Messages embed attachments as standard markdown links (`[name](url)`), so they
 * render here as clickable links with no special handling.
 */
export function SupportMarkdown({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'prose prose-sm max-w-none break-words text-foreground',
        'prose-a:text-primary prose-a:underline-offset-2',
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
