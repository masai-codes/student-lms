'use client'

import { Plus } from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import type { FormEvent } from 'react'

import type { CreateLearnDiscussionKind } from '@/server/new-discussions/services/createDiscussionForLearnEntity'
import { DiscussionCreateModalBody } from '@/components/features/new-discussions/DiscussionCreateModalBody'
import {
  DISCUSSION_MODAL_MAX_BODY_PLAIN,
  DISCUSSION_MODAL_MAX_FILES,
  DISCUSSION_MODAL_MAX_FILE_BYTES,
} from '@/components/features/new-discussions/discussionCreateModal.constants'
import { Button } from '@/components/ui/button'
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalTitle,
} from '@/components/ui/modal'
import { plainTextFromHtml } from '@/lib/plainTextFromHtml'
import { createLearnDiscussion } from '@/server/new-discussions/createLearnDiscussion'
import { DISCUSSION_ATTACHMENT_APPEND_MARKER } from '@/server/new-discussions/utils/validateDiscussionWriteInput'

export type DiscussionCreateModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  kind: CreateLearnDiscussionKind
  entityId: number
}

export function DiscussionCreateModal({
  open,
  onOpenChange,
  kind,
  entityId,
}: DiscussionCreateModalProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [messageHtml, setMessageHtml] = useState('')
  const [files, setFiles] = useState<Array<File>>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const plainLen = plainTextFromHtml(messageHtml)

  function addFiles(next: Array<File>) {
    const merged: Array<File> = [...files]
    for (const f of next) {
      if (merged.length >= DISCUSSION_MODAL_MAX_FILES) break
      if (f.size > DISCUSSION_MODAL_MAX_FILE_BYTES) {
        setError(`Each file must be at most 50MB (${f.name})`)
        continue
      }
      merged.push(f)
    }
    setFiles(merged)
    setError(null)
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      let message = messageHtml.trim()
      if (files.length > 0) {
        const lines = files.map(f => `- ${f.name}`).join('\n')
        message = `${message}${DISCUSSION_ATTACHMENT_APPEND_MARKER}${lines}`
      }
      await createLearnDiscussion({
        data: {
          kind,
          entityId,
          title,
          message,
        },
      })
      setTitle('')
      setMessageHtml('')
      setFiles([])
      onOpenChange(false)
      await router.invalidate()
    } catch {
      setError('Could not create discussion. Try again.')
    } finally {
      setPending(false)
    }
  }

  function handleClose() {
    if (!pending) onOpenChange(false)
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-h-[min(90vh,880px)] max-w-2xl p-0" showCloseButton={false}>
        <form onSubmit={handleSubmit} className="flex max-h-[inherit] flex-col">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <ModalTitle className="text-xl font-semibold text-gray-900">
              Create Discussion
            </ModalTitle>
            <ModalClose
              type="button"
              className="rounded-full p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
              aria-label="Close"
              disabled={pending}
            >
              <span className="text-2xl leading-none">×</span>
            </ModalClose>
          </div>

          <DiscussionCreateModalBody
            title={title}
            onTitleChange={setTitle}
            messageHtml={messageHtml}
            onMessageHtmlChange={setMessageHtml}
            plainLen={plainLen}
            files={files}
            fileInputRef={fileInputRef}
            onFilesSelected={addFiles}
            onRemoveFile={removeFile}
            pending={pending}
            error={error}
          />

          <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-gray-100 bg-white px-6 py-4">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={pending}>
              Close
            </Button>
            <Button
              type="submit"
              className="bg-[#6962AC] hover:bg-[#585196]"
              disabled={
                pending ||
                plainLen === 0 ||
                plainLen > DISCUSSION_MODAL_MAX_BODY_PLAIN ||
                !title.trim()
              }
            >
              <Plus className="mr-1.5 h-4 w-4" weight="bold" aria-hidden />
              {pending ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  )
}
