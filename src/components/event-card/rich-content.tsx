import { MarkdownContent, toMarkdownPreviewText } from '@/components/shared/markdown-content'

type RichContentProps = {
  value: string
  className?: string
}

export function RichContent({ value, className }: RichContentProps) {
  if (!value.trim()) return null

  return (
    <div
      className={cn(
        "min-w-0 max-w-full break-words [&_a]:break-all [&_a]:text-masaiverse-orange [&_a]:underline [&_code]:break-all [&_li]:min-w-0 [&_li]:whitespace-pre-wrap [&_ol]:min-w-0 [&_p]:my-0 [&_p]:min-w-0 [&_p]:whitespace-pre-wrap [&_p+p]:mt-3 [&_ul]:min-w-0",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
        components={markdownComponents}
      >
        {decodeMarkdownPayload(value)}
      </ReactMarkdown>
    </div>
  )
}

export { toMarkdownPreviewText as toRichPreviewText }
