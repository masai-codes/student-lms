/**
 * Shared layout constants for the lecture AI "Ask" chat. The chat renders as a
 * resizable side panel (see `LectureChatSidePanel`); the panel width lives in
 * `useLectureChatWidth`. The open state is intentionally not persisted — the
 * chat always auto-opens on reload (see `useLectureSplitChatOpen`) to keep
 * reminding returning users it exists.
 */

/**
 * At/above this width the AI chat is a resizable right-side rail (laptop /
 * desktop). Below it — mobile and tablet — the chat opens as a bottom drawer.
 */
export const LECTURE_RAIL_MEDIA_QUERY = '(min-width: 1024px)'
