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
 *
 * Written in `rem` to match Tailwind's `lg` breakpoint (`width >= 64rem`)
 * exactly. `1024px` looks equivalent but isn't: a reader who has raised their
 * browser's default font size makes `64rem` wider than `1024px`, and in that gap
 * the rail would mount (JS says desktop) while every `lg:` class stayed off (CSS
 * says mobile) — the chat would stack under the page instead of beside it. Media
 * query `rem` always resolves against the initial font size, same as Tailwind.
 */
export const LECTURE_RAIL_MEDIA_QUERY = '(min-width: 64rem)'
