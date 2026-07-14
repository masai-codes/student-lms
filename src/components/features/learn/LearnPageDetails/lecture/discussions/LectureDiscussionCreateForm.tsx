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
      className={cn(
        'space-y-4 rounded-xl border border-border bg-surface p-4',
        className,
      )}
      onSubmit={(e) => {
        e.preventDefault()
        void handleSubmit()
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="lecture-discussion-title">Title</Label>
        <Input
          id="lecture-discussion-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter the title"
          maxLength={255}
          required
          disabled={disabled}
          className="bg-surface-muted"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lecture-discussion-description">Description</Label>
        <RichTextEditor
          value={descriptionHtml}
          onChange={setDescriptionHtml}
          placeholder="Describe your question or topic"
          className="rounded-lg border border-border"
        />
        <div className="flex justify-end text-xs text-muted-foreground">
          {descriptionLength}/{DISCUSSION_MODAL_MAX_BODY_PLAIN}
        </div>
      </div>

      <div className="flex justify-end">
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
