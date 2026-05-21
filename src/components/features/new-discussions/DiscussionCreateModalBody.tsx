'use client'

import { Paperclip } from '@phosphor-icons/react'
import type { RefObject } from 'react'

import { RichTextEditor } from '@/components/discussion-post-card/rich-text-editor'
import {
  DISCUSSION_MODAL_MAX_BODY_PLAIN,
  DISCUSSION_MODAL_MAX_FILES,
} from '@/components/features/new-discussions/discussionCreateModal.constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type DiscussionCreateModalBodyProps = {
  title: string
  onTitleChange: (value: string) => void
  messageHtml: string
  onMessageHtmlChange: (value: string) => void
  plainLen: number
  files: Array<File>
  fileInputRef: RefObject<HTMLInputElement | null>
  onFilesSelected: (files: Array<File>) => void
  onRemoveFile: (index: number) => void
  pending: boolean
  error: string | null
}

export function DiscussionCreateModalBody({
  title,
  onTitleChange,
  messageHtml,
  onMessageHtmlChange,
  plainLen,
  files,
  fileInputRef,
  onFilesSelected,
  onRemoveFile,
  pending,
  error,
}: DiscussionCreateModalBodyProps) {
  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
      <div className="space-y-1.5">
        <Label htmlFor="modal-discussion-title">Title</Label>
        <Input
          id="modal-discussion-title"
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          placeholder="Enter the title"
          maxLength={255}
          required
          disabled={pending}
          className="bg-gray-50"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Message</Label>
        <RichTextEditor
          value={messageHtml}
          onChange={onMessageHtmlChange}
          placeholder="Type message here"
          className="rounded-lg border border-[#E5E7EB]"
        />
        <div className="flex justify-end text-xs text-muted-foreground">
          {plainLen}/{DISCUSSION_MODAL_MAX_BODY_PLAIN}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-50 pt-2">
        <p className="text-xs text-muted-foreground">Max 3 files, 50MB each</p>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            onChange={event => {
              const list = event.target.files
              if (list?.length) onFilesSelected(Array.from(list))
              event.target.value = ''
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 border-[#E5E7EB]"
            aria-label="Attach files"
            disabled={pending || files.length >= DISCUSSION_MODAL_MAX_FILES}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-5 w-5 text-[#6962AC]" weight="bold" />
          </Button>
        </div>
      </div>

      {files.length > 0 ? (
        <ul className="space-y-1 text-sm text-gray-700">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2">
              <span className="truncate">{f.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 text-red-600"
                onClick={() => onRemoveFile(i)}
                disabled={pending}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  )
}
