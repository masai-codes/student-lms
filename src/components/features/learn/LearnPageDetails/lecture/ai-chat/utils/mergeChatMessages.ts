import type { LectureChatMessage } from '../types'

/**
 * Combines history, live text, and voice transcript messages into a single
 * timeline ordered ascending by timestamp. Stable when timestamps tie.
 */
export function mergeChatMessages(
  ...sources: Array<Array<LectureChatMessage>>
): Array<LectureChatMessage> {
  const merged: Array<LectureChatMessage> = []
  const seen = new Set<string>()

  for (const source of sources) {
    for (const message of source) {
      if (seen.has(message.id)) continue
      seen.add(message.id)
      merged.push(message)
    }
  }

  return merged.sort((a, b) => {
    if (a.timestamp === b.timestamp) return 0
    return a.timestamp - b.timestamp
  })
}

export function formatChatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ''

  const now = Date.now()
  const diffMs = now - timestamp
  if (diffMs >= 0 && diffMs < 60_000) return 'Just now'

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}
