'use client'

import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'

import { cn } from '@/lib/utils'

import { decodeMarkdownPayload } from './decodeMarkdownPayload'
import { getMarkdownComponents, type MarkdownContentVariant } from './getMarkdownComponents'
import { normalizeMarkdownForDisplay } from './normalizeMarkdownForDisplay'
import { markdownSanitizeSchema } from './sanitizeSchema'

import './markdown-content.css'

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
    <div className={cn('markdown-content', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          [rehypeSanitize, markdownSanitizeSchema],
          [rehypeHighlight, { ignoreMissing: true }],
        ]}
        components={getMarkdownComponents(variant)}
      >
        {normalizeMarkdownForDisplay(decodeMarkdownPayload(value))}
      </ReactMarkdown>
    </div>
  )
}
