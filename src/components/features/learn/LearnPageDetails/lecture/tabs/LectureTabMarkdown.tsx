'use client'

import { MarkdownContent } from '@/components/shared/markdown-content'
import { cn } from '@/lib/utils'

type LectureTabMarkdownProps = {
  content: string
  className?: string
}

export function LectureTabMarkdown({ content, className }: LectureTabMarkdownProps) {
  return (
    <MarkdownContent
      value={content}
      variant="detail"
      className={cn('lecture-tab-markdown', className)}
    />
  )
}
