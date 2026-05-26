'use client'

import { useState } from 'react'

import { RichTextEditor } from '@/components/discussion-post-card/rich-text-editor'
import { LECTURE_DISCUSSION_REPLY_MAX_PLAIN } from './lectureDiscussion.constants'
import { Label } from '@/components/ui/label'
import { MasaiButton } from '@/components/ui/masai-button'
import { plainTextFromHtml } from '@/lib/plainTextFromHtml'
import { cn } from '@/lib/utils'

type LectureDiscussionReplyFormProps = {
  className?: string
  disabled?: boolean
  onSubmit?: (messageHtml: string) => void | Promise<void>
}

export function LectureDiscussionReplyForm({
  className,
  disabled = false,
  onSubmit,
}: LectureDiscussionReplyFormProps) {
  const [replyHtml, setReplyHtml] = useState('')

  const replyLength = plainTextFromHtml(replyHtml).length
  const canSubmit =
    replyLength > 0 &&
    replyLength <= LECTURE_DISCUSSION_REPLY_MAX_PLAIN &&
    !disabled

  const handleSubmit = async () => {
    if (!canSubmit) return
    await onSubmit?.(replyHtml.trim())
    setReplyHtml('')
  }

  return (
    <form
      className={cn('space-y-3 rounded-lg border border-gray-200 bg-gray-50/50 p-3', className)}
      onSubmit={e => {
        e.preventDefault()
        void handleSubmit()
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="lecture-discussion-reply">Reply</Label>
        <RichTextEditor
          value={replyHtml}
          onChange={setReplyHtml}
          placeholder="Write your reply"
          className="rounded-lg border border-[#E5E7EB] bg-white"
        />
        <div className="flex justify-end text-xs text-muted-foreground">
          {replyLength}/{LECTURE_DISCUSSION_REPLY_MAX_PLAIN}
        </div>
      </div>

      <div className="flex justify-end">
        <MasaiButton
          type="primary"
          size="sm"
          htmlType="submit"
          ctaText="Post reply"
          disabled={!canSubmit}
        />
      </div>
    </form>
  )
}
