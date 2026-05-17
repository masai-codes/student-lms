'use client'

import { useState } from 'react'

import { RichTextEditor } from '@/components/discussion-post-card/rich-text-editor'
import { MasaiButton } from '@/components/ui/masai-button'
import { cn } from '@/lib/utils'

type LectureDiscussionComposerProps = {
  className?: string
  onSubmit?: (payload: { title: string; descriptionMarkdown: string }) => void
}

function plainTextFromHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

export function LectureDiscussionComposer({
  className,
  onSubmit,
}: LectureDiscussionComposerProps) {
  const [title, setTitle] = useState('')
  const [descriptionHtml, setDescriptionHtml] = useState('')

  const canSubmit =
    title.trim().length > 0 && plainTextFromHtml(descriptionHtml).length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit?.({
      title: title.trim(),
      descriptionMarkdown: descriptionHtml.trim(),
    })
    setTitle('')
    setDescriptionHtml('')
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm',
        className,
      )}
    >
      <div className="border-b border-gray-100 px-3 py-2">
        <label htmlFor="lecture-discussion-title" className="sr-only">
          Discussion title
        </label>
        <input
          id="lecture-discussion-title"
          type="text"
          placeholder="Title"
          value={title}
          onChange={event => setTitle(event.target.value)}
          className="type-b2-regular w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-400"
        />
      </div>

      <RichTextEditor
        embedded
        value={descriptionHtml}
        onChange={setDescriptionHtml}
        placeholder="Write your message…"
        contentClassName="!min-h-[4.5rem] !max-h-[7.5rem] !overflow-y-auto !rounded-none !border-0 !px-3 !py-2 [&_p]:!my-0 [&_p+p]:!mt-1.5"
      />

      <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-[#FAF9F9] px-3 py-2">
        <MasaiButton
          kind="primary"
          size="sm"
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          Post
        </MasaiButton>
      </div>
    </div>
  )
}
