import { plainTextFromHtml } from '@/lib/plainTextFromHtml'

const MAX_TITLE_LENGTH = 255

function plainTextFromFirstParagraph(messageHtml: string): string {
  const firstParagraph = messageHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1]
  if (firstParagraph != null) {
    return plainTextFromHtml(firstParagraph)
  }
  return plainTextFromHtml(messageHtml)
}

/** API requires a title; use the first line of the comment body when the UI has no title field. */
export function deriveDiscussionTitleFromMessage(messageHtml: string): string {
  const plain = plainTextFromFirstParagraph(messageHtml)
  const firstLine =
    plain
      .split(/\n/)
      .map((s) => s.trim())
      .find(Boolean) ?? plain
  const trimmed = firstLine.trim()
  if (trimmed.length === 0) return ''
  if (trimmed.length <= MAX_TITLE_LENGTH) return trimmed
  return `${trimmed.slice(0, MAX_TITLE_LENGTH - 1)}…`
}
