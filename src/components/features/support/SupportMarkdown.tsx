import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'

import { cn } from '@/lib/utils'

/**
 * SupportMarkdown — safe, compact renderer for FAQ answers and ticket messages.
 *
 * GitHub-flavoured markdown PLUS the inline HTML that legacy ticket comments use
 * (`<br/>`, `<b>`, links, lists, …): `rehype-raw` parses the embedded HTML and
 * `rehype-sanitize` then strips anything unsafe, so coordinator replies created
 * by the old system — and the new "first template response" — render with their
 * intended line breaks and signature instead of showing raw tags. Links open in
 * a new tab; typography uses `prose`.
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
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          a: (props) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
