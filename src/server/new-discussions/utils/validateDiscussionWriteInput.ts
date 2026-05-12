import { plainTextFromHtml } from '@/lib/plainTextFromHtml'

export type TrimmedDiscussionFields = { title: string; message: string }

/** Client appends filenames after this marker; limit applies only to HTML above it. */
export const DISCUSSION_ATTACHMENT_APPEND_MARKER = '\n\n---\nAttachments:\n'

export function parseCreateDiscussionInput(raw: {
  title: string
  message: string
}): TrimmedDiscussionFields {
  const title = raw.title.trim()
  const message = raw.message.trim()
  if (title.length === 0 || title.length > 255) {
    throw new Error('INVALID_DISCUSSION_TITLE')
  }
  const markerIdx = message.indexOf(DISCUSSION_ATTACHMENT_APPEND_MARKER)
  const bodyHtml =
    markerIdx >= 0 ? message.slice(0, markerIdx).trim() : message
  const plainBody = plainTextFromHtml(bodyHtml)
  if (plainBody.length === 0 || plainBody.length > 2000) {
    throw new Error('INVALID_DISCUSSION_MESSAGE')
  }
  return { title, message }
}

export function parseReplyMessage(raw: string): string {
  const message = raw.trim()
  if (message.length === 0 || message.length > 4000) {
    throw new Error('INVALID_REPLY_MESSAGE')
  }
  return message
}
