import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'

import { cn } from '@/lib/utils'
import { ImageThumbnail, SmartLink } from '@/components/features/support/AttachmentPreview'

// GitHub's sanitize schema (rehype-sanitize's default) omits `<u>` — the chat
// composer's underline button relies on it, so it's added back explicitly.
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'u'],
}

/**
 * Legacy ticket comments already encode paragraph gaps as `<br/><br/>`.
 * Whitespace (including source newlines) after those tags would become a third
 * line break once `remark-breaks` runs — strip it, then cap runs of breaks so
 * older stacked templates (`…<br/>` + `<br/><br/>…`) don't look double-spaced.
 */
function normalizeLegacyBreaks(source: string): string {
  return source
    .replace(/(<br\s*\/?>)\s+/gi, '$1')
    .replace(/(?:<br\s*\/?>\\s*){3,}/gi, '<br/><br/>')
}

/**
 * SupportMarkdown — safe, compact renderer for FAQ answers and ticket messages.
 *
 * GitHub-flavoured markdown PLUS the inline HTML that legacy ticket comments use
 * (`<br/>`, `<b>`, links, lists, …): `rehype-raw` parses the embedded HTML and
 * `rehype-sanitize` then strips anything unsafe. `remark-breaks` keeps single
 * Enter presses as visible line breaks (chat-style), matching Write mode.
 *
 * Attachments embedded as markdown links/images are detected by extension and
 * rendered as beautiful interactive chips (image lightbox / video / file).
 */
export function SupportMarkdown({
  children,
  className,
  variant = 'agent',
}: {
  children: string
  className?: string
  variant?: 'user' | 'agent'
}) {
  return (
    <div
      className={cn(
        'max-w-none break-words text-foreground',
        // Tailwind preflight zeroes list styles — restore bullets/numbers so
        // Write → Preview matches what students expect from the toolbar.
        '[&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5',
        '[&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5',
        '[&_li]:my-0.5 [&_li]:leading-[1.45]',
        '[&_p]:my-0 [&_p]:leading-[1.45]',
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
        components={{
          // ── Images: rendered as a click-to-preview thumbnail chip ─────────
          img: ({ src, alt }) => {
            if (!src) return null
            return <ImageThumbnail src={src} alt={alt ?? ''} variant={variant} />
          },

          // ── Links: smart detection for file / video / image / generic ─────
          a: ({ href, children: linkChildren }) => {
            if (!href) return <>{linkChildren}</>

            // The name is the text node inside <a>…</a>, or the href if empty.
            const name =
              typeof linkChildren === 'string' && linkChildren.trim()
                ? linkChildren.trim()
                : href

            return <SmartLink href={href} name={name} variant={variant} />
          },

          // ── Code ──────────────────────────────────────────────────────────
          code: ({ className: codeClassName, children: codeChildren, ...props }) => {
            const isBlock = String(codeChildren).includes('\n')
            if (isBlock) {
              return (
                <code
                  {...props}
                  className={cn('font-mono text-[12.5px] leading-[1.5]', codeClassName)}
                >
                  {codeChildren}
                </code>
              )
            }
            return (
              <code
                {...props}
                className={cn(
                  'rounded-[4px] border border-[#d1d2d3] bg-[#f8f8fa] px-[5px] py-[1px] font-mono text-[12.5px] text-[#e01e5a]',
                  codeClassName,
                )}
              >
                {codeChildren}
              </code>
            )
          },

          // ── Pre ───────────────────────────────────────────────────────────
          pre: ({ className: preClassName, ...props }) => (
            <pre
              {...props}
              className={cn(
                'rounded-[6px] border border-[#d1d2d3] bg-[#f8f8fa] p-3 overflow-x-auto',
                preClassName,
              )}
            />
          ),
        }}
      >
        {normalizeLegacyBreaks(children)}
      </ReactMarkdown>
    </div>
  )
}
