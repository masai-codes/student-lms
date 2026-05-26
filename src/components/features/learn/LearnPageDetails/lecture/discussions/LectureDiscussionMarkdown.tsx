'use client'

import type { ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { RichTextContent } from '@/components/discussion-post-card/rich-text-content'
import { cn } from '@/lib/utils'

const markdownComponents = {
  p: ({ children }: { children?: ReactNode }) => (
    <p className="mb-2 last:mb-0 text-gray-700">{children}</p>
  ),
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-semibold text-gray-900">{children}</strong>
  ),
}

function isHtmlContent(content: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(content.trim())
}

type LectureDiscussionMarkdownProps = {
  content: string
  className?: string
}

export function LectureDiscussionMarkdown({
  content,
  className,
}: LectureDiscussionMarkdownProps) {
  if (isHtmlContent(content)) {
    return (
      <RichTextContent
        html={content}
        className={cn(
          'type-b2-regular text-gray-700 [&_p]:my-0 [&_p+p]:mt-2',
          className,
        )}
      />
    )
  }

  return (
    <div className={cn('type-b2-regular', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
