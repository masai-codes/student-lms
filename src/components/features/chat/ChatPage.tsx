const CHAT_URL = 'https://connect.masaischool.com'

/**
 * Full-bleed chat surface: a single iframe embedding the cohort chat app.
 * Sized to fill whatever the route shell gives it (see `isChatRoute` in
 * `routes/(protected)/_layout/route.tsx`, which switches `<main>` to the
 * full-width/height layout other full-bleed surfaces — Masaiverse, lecture
 * detail — use).
 */
export function ChatPage() {
  return (
    <div className="flex w-full flex-1 min-h-0 flex-col">
      <iframe
        src={CHAT_URL}
        title="Chat"
        className="w-full flex-1 min-h-0 border-0"
        allow="camera; microphone; clipboard-write"
      />
    </div>
  )
}
