import { pushDashboardEvent } from '../shared/dashboardAnalytics'
import type { DashboardSupportSession } from '@/server/api/dashboard/support/getSupportSessions.service'
import type { SupportSessionStatus } from '@/server/api/dashboard/support/supportSessionStatus'

interface LmsSupportPanelProps {
  /** The single featured session, or null to hide the card entirely. */
  session: DashboardSupportSession | null
}

const SUPPORT_ILLUSTRATION = '/lmssupportsession.svg'

const SUBTEXT: Record<SupportSessionStatus, string> = {
  live: "We're live now to help you",
  today: 'Join our daily session to get your questions answered',
  upcoming: 'No session today, the next session is scheduled for',
}

// The one support-session card the backend selected. Hidden entirely when there
// is no session (and while loading, the parent passes null). The backend
// decides live/today/upcoming; this only renders. The card body is never
// clickable — the only interactive element is the live "Join Now" button.
export function LmsSupportPanel({ session }: LmsSupportPanelProps) {
  if (!session) return null

  const isLive = session.status === 'live'

  return (
    <section
      data-testid="dashboard-lms-support-panel"
      data-status={session.status}
      className={`flex items-center gap-3 rounded-2xl border p-4 ${
        isLive ? 'border-[#C3DDFD] bg-[#E1EFFE]' : 'border-[#E5E7EB] bg-[#F9FAFB]'
      }`}
    >
      <img src={SUPPORT_ILLUSTRATION} alt="" className="size-12 shrink-0" />

      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-semibold text-gray-900">LMS Support Session</h4>
        <p className="mt-0.5 text-xs text-gray-600">{SUBTEXT[session.status]}</p>
        {!isLive && session.schedule && (
          <span
            data-testid="dashboard-support-session-time"
            className="mt-1.5 inline-block rounded-md bg-[#FDF6B2] px-2 py-0.5 text-xs font-semibold text-gray-800"
          >
            {formatSessionPill(session.schedule)}
          </span>
        )}
      </div>

      {isLive && session.zoomLink && (
        <a
          href={session.zoomLink}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="dashboard-support-session-join"
          onClick={() =>
            pushDashboardEvent('l_dashboard_support_join_id_' + session.id, {
              session_id: session.id,
              status: session.status,
            })
          }
          className="inline-flex shrink-0 items-center rounded-lg bg-[#3F83F8] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#3576e0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3F83F8]"
        >
          Join Now
        </a>
      )}
    </section>
  )
}

/** Renders an IST ISO timestamp as e.g. "2 Jul, 6:30 PM (IST)". */
function formatSessionPill(iso: string): string {
  const at = new Date(iso)
  const date = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(at)
  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }).format(at)
  return `${date}, ${time} (IST)`
}
