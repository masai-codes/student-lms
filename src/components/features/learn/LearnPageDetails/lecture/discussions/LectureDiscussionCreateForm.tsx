'use client'

import { useState } from 'react'

import { RichTextEditor } from '@/components/discussion-post-card/rich-text-editor'
import { DISCUSSION_MODAL_MAX_BODY_PLAIN } from '@/components/features/new-discussions/discussionCreateModal.constants'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MasaiButton } from '@/components/ui/masai-button'
import { plainTextFromHtml } from '@/lib/plainTextFromHtml'
import { cn } from '@/lib/utils'

type LectureDiscussionCreateFormProps = {
  className?: string
  disabled?: boolean
  onSubmit?: (payload: {
    title: string
    descriptionMarkdown: string
  }) => void | Promise<void>
}

export function LectureDiscussionCreateForm({
  className,
  disabled = false,
  onSubmit,
}: LectureDiscussionCreateFormProps) {
  const [title, setTitle] = useState('')
  const [descriptionHtml, setDescriptionHtml] = useState('')

  const descriptionLength = plainTextFromHtml(descriptionHtml).length
  const canSubmit =
    title.trim().length > 0 &&
    descriptionLength > 0 &&
    descriptionLength <= DISCUSSION_MODAL_MAX_BODY_PLAIN &&
    !disabled

  const handleSubmit = async () => {
    if (!canSubmit) return
    await onSubmit?.({
      title: title.trim(),
      descriptionMarkdown: descriptionHtml.trim(),
    })
    setTitle('')
    setDescriptionHtml('')
  }

  return (
    <form
      data-testid="lecture-discussion-create-form"
      className={cn('space-y-2', className)}
      onSubmit={(e) => {
        e.preventDefault()
        void handleSubmit()
      }}
    >
      <Label htmlFor="lecture-discussion-title" className="sr-only">
        Discussion title
      </Label>
      <div className="overflow-hidden rounded-xl border border-border bg-surface transition-colors duration-200 focus-within:border-brand/60 focus-within:ring-2 focus-within:ring-brand/15">
        <Input
          id="lecture-discussion-title"
          data-testid="lecture-discussion-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          maxLength={255}
          required
          disabled={disabled}
          className="h-auto rounded-none border-0 bg-transparent px-3 py-2.5 type-b2-regular font-semibold shadow-none placeholder:font-normal focus-visible:ring-0"
        />
        <div className="h-px bg-border" />
        <RichTextEditor
          value={descriptionHtml}
          onChange={setDescriptionHtml}
          placeholder="Describe your question or topic"
          embedded
        />
      </div>

      <div className="flex items-center justify-between">
        <span
          data-testid="lecture-discussion-char-count"
          className={cn(
            'text-xs tabular-nums text-muted-foreground transition-colors',
            descriptionLength > DISCUSSION_MODAL_MAX_BODY_PLAIN && 'text-danger',
          )}
        >
          {descriptionLength}/{DISCUSSION_MODAL_MAX_BODY_PLAIN}
        </span>
        <MasaiButton
          type="primary"
          size="sm"
          htmlType="submit"
          ctaText="Post discussion"
          disabled={!canSubmit}
        />
      </div>
    </form>
  )
}
