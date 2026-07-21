'use client'

import { useState } from 'react'

import { initialsFromName } from './utils/initialsFromName'

import { RichTextEditor } from '@/components/discussion-post-card/rich-text-editor'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MasaiButton } from '@/components/ui/masai-button'
import { plainTextFromHtml } from '@/lib/plainTextFromHtml'
import { cn } from '@/lib/utils'

type LectureDiscussionComposerProps = {
  className?: string
  userName: string
  userAvatarUrl?: string | null
  disabled?: boolean
  onSubmit?: (payload: { descriptionMarkdown: string }) => void | Promise<void>
}

export function LectureDiscussionComposer({
  className,
  userName,
  userAvatarUrl = null,
  disabled = false,
  onSubmit,
}: LectureDiscussionComposerProps) {
  const [descriptionHtml, setDescriptionHtml] = useState('')

  const canSubmit = plainTextFromHtml(descriptionHtml).length > 0 && !disabled
  const hasDraft = plainTextFromHtml(descriptionHtml).length > 0

  const handleSubmit = async () => {
    if (!canSubmit) return
    await onSubmit?.({ descriptionMarkdown: descriptionHtml.trim() })
    setDescriptionHtml('')
  }

  const showActions = hasDraft

  return (
    <div className={cn('flex gap-3', className)}>
      <Avatar size="lg" className="size-10 shrink-0">
        {userAvatarUrl ? (
          <AvatarImage src={userAvatarUrl} alt={userName} />
        ) : null}
        <AvatarFallback className="type-b3-md bg-surface-muted text-foreground">
          {initialsFromName(userName)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div
          className={cn(
            'rounded-2xl border bg-surface transition-[border-color,box-shadow] duration-200',
            'focus-within:border-brand/50 focus-within:ring-2 focus-within:ring-brand/15',
            hasDraft ? 'border-border-strong shadow-sm' : 'border-border',
          )}
        >
          <RichTextEditor
            embedded
            showToolbar={false}
            value={descriptionHtml}
            onChange={setDescriptionHtml}
            placeholder="Add a comment…"
            contentClassName={cn(
              '!min-h-[2.5rem] !max-h-[7.5rem] !overflow-y-auto !rounded-2xl !border-0 !px-3 !py-2.5',
              '[&_p]:!my-0 [&_p+p]:!mt-1.5',
            )}
          />
        </div>

        {showActions ? (
          <div className="mt-2 flex items-center justify-end gap-2">
            <MasaiButton
              kind="secondary"
              size="sm"
              htmlType="button"
              disabled={disabled}
              onClick={() => setDescriptionHtml('')}
              className="transition-transform duration-150 active:scale-95"
            >
              Cancel
            </MasaiButton>
            <MasaiButton
              kind="primary"
              size="sm"
              htmlType="button"
              disabled={!canSubmit}
              onClick={() => void handleSubmit()}
              className="transition-transform duration-150 active:scale-95"
            >
              Comment
            </MasaiButton>
          </div>
        ) : null}
      </div>
    </div>
  )
}
