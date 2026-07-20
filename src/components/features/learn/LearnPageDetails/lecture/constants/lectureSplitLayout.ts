/**
 * Shared open state for the lecture AI "Ask" chat. The chat renders as a
 * floating popup (see `LectureFloatingChat`) rather than a sidebar, so no width
 * constants are needed — only the open-by-default and persistence keys.
 */

/** Open the floating AI chat popup by default on desktop. */
export const LECTURE_SPLIT_CHAT_OPEN_BY_DEFAULT = false

/** Persists whether the user left the floating chat popup open. */
export const LECTURE_SPLIT_CHAT_STORAGE_KEY = 'lecture-split-chat-open'
