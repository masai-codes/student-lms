'use client'

import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import { cn } from '@/lib/utils'

import { decodeMarkdownPayload } from './decodeMarkdownPayload'
import {
  getMarkdownComponents,
  type MarkdownContentVariant,
} from './getMarkdownComponents'
import { normalizeMarkdownForDisplay } from './normalizeMarkdownForDisplay'
import { protectMathSpans } from './normalizeMathSpans'
import { markdownSanitizeSchema } from './sanitizeSchema'

import 'katex/dist/katex.min.css'
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

  // Shield math from decodeMarkdownPayload (which would corrupt LaTeX commands
  // like \to / \theta) and normalise \(...\) / \[...\] to $...$ / $$...$$.
  const { masked, restore } = protectMathSpans(value)
  const source = restore(
    normalizeMarkdownForDisplay(decodeMarkdownPayload(masked)),
  )

  return (
    <div
      className={cn(
        'markdown-content',
        `markdown-content--${variant}`,
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          [rehypeSanitize, markdownSanitizeSchema],
          [rehypeHighlight, { ignoreMissing: true }],
          rehypeKatex,
        ]}
        components={getMarkdownComponents(variant)}
      >
        {source}
      </ReactMarkdown>
    </div>
  )
}
