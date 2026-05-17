'use client'

import { useState } from 'react'

import { LectureDiscussionCard } from './LectureDiscussionCard'
import { LectureDiscussionComposer } from './LectureDiscussionComposer'
import {
  STATIC_LECTURE_DISCUSSIONS,
  type StaticLectureDiscussion,
} from './constants/staticLectureDiscussions'

import { cn } from '@/lib/utils'

type LectureDiscussionsSectionProps = {
  className?: string
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'ME'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase()
}

export function LectureDiscussionsSection({
  className,
}: LectureDiscussionsSectionProps) {
  const [discussions, setDiscussions] = useState(STATIC_LECTURE_DISCUSSIONS)

  const handlePost = (payload: {
    title: string
    descriptionMarkdown: string
  }) => {
    const next: StaticLectureDiscussion = {
      id: Date.now(),
      title: payload.title,
      bodyMarkdown: payload.descriptionMarkdown,
      authorName: 'You',
      authorInitials: initialsFromName('You'),
      postedAtLabel: 'Just now',
      replyCount: 0,
    }
    setDiscussions(current => [next, ...current])
  }

  return (
    <section
      className={cn(
        'border-t border-border bg-background px-4 py-6 md:px-6',
        className,
      )}
    >
      <h2 className="type-h6 mb-4 text-gray-900">
        Discussions
        <span className="type-b2-regular ml-2 font-normal text-gray-500">
          ({discussions.length})
        </span>
      </h2>

      <LectureDiscussionComposer className="mb-6" onSubmit={handlePost} />

      <div className="divide-y divide-gray-100">
        {discussions.map(discussion => (
          <LectureDiscussionCard key={discussion.id} discussion={discussion} />
        ))}
      </div>
    </section>
  )
}
