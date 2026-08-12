'use client'

import { FileText } from 'lucide-react'

import { ExpandableTabContent } from './ExpandableTabContent'
import { LectureTabMarkdown } from './LectureTabMarkdown'

type LectureNotesTabContentProps = {
  notes: string | null
}

export function LectureNotesTabContent({ notes }: LectureNotesTabContentProps) {
  if (!notes) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
        <FileText
          className="size-[72px] text-gray-200 dark:text-border-strong"
          strokeWidth={1}
          aria-hidden
        />
        <p className="type-b1-md text-foreground">Nothing here yet</p>
        <p className="type-b2-regular max-w-sm text-foreground-muted">
          Looks like notes are not available for this lecture at the moment.
        </p>
      </div>
    )
  }

  return (
    <ExpandableTabContent>
      <LectureTabMarkdown content={notes} />
    </ExpandableTabContent>
  )
}
