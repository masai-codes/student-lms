/**
 * Shared open state for the lecture AI "Ask" chat. The chat renders as a
 * resizable side panel (see `LectureChatSidePanel`); the panel width lives in
 * `useLectureChatWidth`, so only the open-by-default + persistence keys live here.
 */

/** Open the AI chat side panel by default on desktop. */
export const LECTURE_SPLIT_CHAT_OPEN_BY_DEFAULT = true

/**
 * At/above this width the AI chat is a resizable right-side rail (laptop /
 * desktop). Below it — mobile and tablet — the chat opens as a bottom drawer.
 */
export const LECTURE_RAIL_MEDIA_QUERY = '(min-width: 1024px)'

/** Persists whether the user left the chat panel open. */
export const LECTURE_SPLIT_CHAT_STORAGE_KEY = 'lecture-split-chat-open'
