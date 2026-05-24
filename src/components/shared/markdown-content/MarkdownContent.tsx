'use client'

import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'

import { cn } from '@/lib/utils'

import { decodeMarkdownPayload } from './decodeMarkdownPayload'
import { getMarkdownComponents, type MarkdownContentVariant } from './getMarkdownComponents'
import { markdownSanitizeSchema } from './sanitizeSchema'

const markdownLayoutClassName =
  'min-w-0 max-w-full break-words [&_a]:break-all [&_code]:break-all [&_li]:min-w-0 [&_li]:whitespace-pre-wrap [&_ol]:min-w-0 [&_p]:min-w-0 [&_p]:whitespace-pre-wrap [&_ul]:min-w-0'

type MarkdownContentProps = {
  value: string
  className?: string
  variant?: MarkdownContentVariant
}

export function MarkdownContent({
  value,
  className,
  variant = 'detail',
}: MarkdownContentProps) {
  if (!value.trim()) return null

  return (
    <div className={cn(markdownLayoutClassName, className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema]]}
        components={getMarkdownComponents(variant)}
      >
        {decodeMarkdownPayload(value)}
      </ReactMarkdown>
    </div>
  )
}
