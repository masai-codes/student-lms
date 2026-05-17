'use client'

import type { ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { cn } from '@/lib/utils'

const markdownComponents = {
  p: ({ children }: { children?: ReactNode }) => (
    <p className="mb-2 last:mb-0 text-gray-700">{children}</p>
  ),
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-semibold text-gray-900">{children}</strong>
  ),
}

type LectureDiscussionMarkdownProps = {
  content: string
  className?: string
}

export function LectureDiscussionMarkdown({
  content,
  className,
}: LectureDiscussionMarkdownProps) {
  return (
    <div className={cn('type-b2-regular', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
