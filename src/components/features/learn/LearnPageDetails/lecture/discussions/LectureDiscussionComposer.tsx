'use client'

import { useState } from 'react'

import { MasaiButton } from '@/components/ui/masai-button'
import { MasaiInput } from '@/components/ui/masai-input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type LectureDiscussionComposerProps = {
  className?: string
  onSubmit?: (payload: { title: string; descriptionMarkdown: string }) => void
}

export function LectureDiscussionComposer({
  className,
  onSubmit,
}: LectureDiscussionComposerProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const canSubmit = title.trim().length > 0 && description.trim().length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit?.({
      title: title.trim(),
      descriptionMarkdown: description.trim(),
    })
    setTitle('')
    setDescription('')
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="space-y-1.5">
        <label htmlFor="lecture-discussion-title" className="type-b2-md text-gray-900">
          Title
        </label>
        <MasaiInput
          id="lecture-discussion-title"
          placeholder="Add a discussion title"
          value={title}
          onChange={event => setTitle(event.target.value)}
          className="w-full"
        />
      </div>
      <div className="space-y-1.5">
        <label
          htmlFor="lecture-discussion-description"
          className="type-b2-md text-gray-900"
        >
          Description
        </label>
        <p className="type-caption-regular text-gray-500">Supports Markdown</p>
        <Textarea
          id="lecture-discussion-description"
          placeholder="Share your question or thoughts…"
          value={description}
          onChange={event => setDescription(event.target.value)}
          className="min-h-[120px] resize-y rounded-lg border-gray-200 bg-white type-b2-regular"
        />
      </div>
      <div className="flex justify-end">
        <MasaiButton
          kind="primary"
          size="md"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          Post
        </MasaiButton>
      </div>
    </div>
  )
}
