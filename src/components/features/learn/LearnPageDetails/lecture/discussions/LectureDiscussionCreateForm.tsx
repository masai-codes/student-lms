'use client'

import { useRef, useState } from 'react'

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
  const [error, setError] = useState<{
    field: 'title' | 'description'
    message: string
  } | null>(null)

  const titleInputRef = useRef<HTMLInputElement>(null)
  const composerRef = useRef<HTMLDivElement>(null)

  const descriptionLength = plainTextFromHtml(descriptionHtml).length

  const validate = (): typeof error => {
    if (title.trim().length === 0)
      return { field: 'title', message: 'Please add a title for your discussion.' }
    if (descriptionLength === 0)
      return { field: 'description', message: 'Please add a description.' }
    if (descriptionLength > DISCUSSION_MODAL_MAX_BODY_PLAIN)
      return {
        field: 'description',
        message: `Description must be ${DISCUSSION_MODAL_MAX_BODY_PLAIN} characters or fewer.`,
      }
    return null
  }

  const focusField = (field: 'title' | 'description') => {
    if (field === 'title') {
      titleInputRef.current?.focus()
      return
    }
    // The rich-text editor renders a contenteditable node we can focus directly.
    composerRef.current
      ?.querySelector<HTMLElement>('[contenteditable="true"]')
      ?.focus()
  }

  // Clear the validation error as soon as the user edits either field, so the
  // red hint disappears the moment they act on it.
  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (error) setError(null)
  }

  const handleDescriptionChange = (value: string) => {
    setDescriptionHtml(value)
    if (error) setError(null)
  }

  const handleSubmit = async () => {
    if (disabled) return
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      focusField(validationError.field)
      return
    }
    setError(null)
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
      <div
        ref={composerRef}
        className={cn(
          'overflow-hidden rounded-xl border bg-surface transition-colors duration-200 focus-within:ring-2',
          error
            ? 'border-danger/60 focus-within:border-danger/60 focus-within:ring-danger/15'
            : 'border-border focus-within:border-brand/60 focus-within:ring-brand/15',
        )}
      >
        <Input
          ref={titleInputRef}
          id="lecture-discussion-title"
          data-testid="lecture-discussion-title-input"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Title"
          maxLength={255}
          disabled={disabled}
          aria-invalid={error?.field === 'title'}
          className="h-auto rounded-none border-0 bg-transparent px-3 py-2.5 type-b2-regular text-foreground shadow-none placeholder:text-foreground-subtle focus-visible:ring-0"
        />
        {error?.field === 'title' ? (
          <p
            role="alert"
            data-testid="lecture-discussion-create-error"
            className="type-caption-regular px-3 pb-2 text-danger"
          >
            {error.message}
          </p>
        ) : null}
        <div className="h-px bg-border" />
        <RichTextEditor
          value={descriptionHtml}
          onChange={handleDescriptionChange}
          placeholder="Describe your question or topic"
          embedded
        />
      </div>

      {error?.field === 'description' ? (
        <p
          role="alert"
          data-testid="lecture-discussion-create-error"
          className="type-caption-regular text-danger"
        >
          {error.message}
        </p>
      ) : null}

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
          disabled={disabled}
        />
      </div>
    </form>
  )
}
