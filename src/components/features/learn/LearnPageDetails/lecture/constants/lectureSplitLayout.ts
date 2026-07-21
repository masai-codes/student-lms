/**
 * Shared open state for the lecture AI "Ask" chat. The chat renders as a
 * resizable side panel (see `LectureChatSidePanel`); the panel width lives in
 * `useLectureChatWidth`, so only the open-by-default + persistence keys live here.
 */

/** Open the AI chat side panel by default on desktop. */
export const LECTURE_SPLIT_CHAT_OPEN_BY_DEFAULT = true

/** Persists whether the user left the chat panel open. */
export const LECTURE_SPLIT_CHAT_STORAGE_KEY = 'lecture-split-chat-open'
