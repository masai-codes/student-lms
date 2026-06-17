/** Open chat sidebar width (% of hero row on desktop). */
export const LECTURE_SPLIT_CHAT_OPEN_WIDTH_PERCENT = 35

/** Min/max sidebar width (px) when open — keeps chat readable without shrinking video too much. */
export const LECTURE_SPLIT_CHAT_MIN_WIDTH_PX = 360
export const LECTURE_SPLIT_CHAT_MAX_WIDTH_PX = 520

/** Open AI chat panel by default in the desktop sidebar. */
export const LECTURE_SPLIT_CHAT_OPEN_BY_DEFAULT = false

/** Persists whether the user left the desktop chat sidebar open. */
export const LECTURE_SPLIT_CHAT_STORAGE_KEY = 'lecture-split-chat-open'

export function getLectureSplitChatOpenWidthCss(): string {
  return `clamp(${LECTURE_SPLIT_CHAT_MIN_WIDTH_PX}px, ${LECTURE_SPLIT_CHAT_OPEN_WIDTH_PERCENT}%, ${LECTURE_SPLIT_CHAT_MAX_WIDTH_PX}px)`
}
