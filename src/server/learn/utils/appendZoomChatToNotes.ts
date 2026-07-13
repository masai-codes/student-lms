import { normalizeNullableText } from '@/server/learn/utils/normalizeNullableText'

/**
 * A single link scraped from a lecture's Zoom chat, as stored in
 * `lecture_zoom_chat.final_chat` (JSON array). Only `url` is required.
 */
export type ZoomChatLinkEntry = {
  url?: unknown
}

/** Keep only entries that carry a non-empty string URL. */
export function parseFinalChatLinks(finalChat: unknown): Array<ZoomChatLinkEntry> {
  if (!Array.isArray(finalChat)) return []
  return finalChat.filter(
    (link): link is ZoomChatLinkEntry =>
      !!link &&
      typeof link === 'object' &&
      typeof (link as { url?: unknown }).url === 'string' &&
      (link as { url: string }).url.trim() !== '',
  )
}

/** Build the "Resources shared" markdown block, or null when there are no links. */
export function formatZoomChatLinksForNotes(
  links: Array<ZoomChatLinkEntry>,
): string | null {
  const urls = links
    .map(link => (typeof link.url === 'string' ? link.url.trim() : ''))
    .filter(Boolean)
  if (!urls.length) return null

  const numberedList = urls.map((url, index) => `${index + 1}. ${url}`).join('\n')
  return `Resources shared :-\n\n${numberedList}`
}

/**
 * Student-facing lecture notes = the raw `lectures.notes` with the Zoom-chat
 * "Resources shared" links appended (or just the chat links when notes are
 * empty). Mirrors the legacy LMS `appendZoomChatToNotes` so the Description tab
 * stays in parity across old and new LMS.
 */
export function appendZoomChatToNotes(
  notes: string | null | undefined,
  finalChat: unknown,
): string | null {
  const zoomChatSection = formatZoomChatLinksForNotes(
    parseFinalChatLinks(finalChat),
  )
  if (!zoomChatSection) {
    return normalizeNullableText(notes)
  }

  const trimmedNotes = normalizeNullableText(notes)
  if (!trimmedNotes) return zoomChatSection
  return `${trimmedNotes}\n\n${zoomChatSection}`
}
