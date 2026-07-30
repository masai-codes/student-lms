import { pushDashboardEvent } from '../shared/dashboardAnalytics'
import type { DashboardSupportSession } from '@/server/api/dashboard/support/getSupportSessions.service'
import type { SupportSessionStatus } from '@/server/api/dashboard/support/supportSessionStatus'
import { hidesMasaiOnlyFeatures } from '@/utils/portal'
import { formatTimestampLocal, isTodayLocal } from '@/utils/timeZoneHandler'

interface LmsSupportPanelProps {
  /** The single featured session, or null to hide the card entirely. */
  session: DashboardSupportSession | null
  /** Injectable for deterministic tests; defaults to the current time. */
  now?: Date
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
export function LmsSupportPanel({
  session,
  now = new Date(),
}: LmsSupportPanelProps) {
  // The LMS support-session card is a Masai-only surface — hidden on non-Masai
  // portals (iHub, IIT Jodhpur).
  if (hidesMasaiOnlyFeatures()) return null
  if (!session) return null

  // `session.status` is computed server-side in IST. Trust it for the real-time
  // "live" check, but re-decide today/upcoming in the viewer's LOCAL timezone so
  // a non-IST viewer near midnight sees the correct day bucket (and the pill
  // below renders the same instant in their local time).
  const status: SupportSessionStatus =
    session.status === 'live'
      ? 'live'
      : session.schedule && isTodayLocal(session.schedule, now)
        ? 'today'
        : 'upcoming'
  const isLive = status === 'live'

  return (
    <section
      data-testid="dashboard-lms-support-panel"
      data-status={status}
      className={`flex items-center gap-3 rounded-2xl border p-4 transition-shadow duration-300 ${
        isLive
          ? 'dash-sheen border-[#C3DDFD] bg-gradient-to-r from-[#E1EFFE] to-[#E7ECFE] shadow-[0_6px_20px_-8px_rgb(63_131_248_/_0.35)] dark:border-info-subtle dark:bg-none dark:bg-info-subtle'
          : 'border-border bg-surface-muted hover:shadow-sm'
      }`}
    >
      <img src={SUPPORT_ILLUSTRATION} alt="" className="size-12 shrink-0" />

      <div className="min-w-0 flex-1">
        <h4 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          LMS Support Session
          {isLive && (
            <span aria-hidden className="relative flex size-2">
              <span className="animate-dash-ping absolute inset-0 rounded-full bg-danger" />
              <span className="relative size-2 rounded-full bg-danger" />
            </span>
          )}
        </h4>
        <p className="mt-0.5 text-xs text-foreground-muted">
          {SUBTEXT[status]}
        </p>
        {!isLive && session.schedule && (
          <span
            data-testid="dashboard-support-session-time"
            className="mt-1.5 inline-block rounded-md bg-[#FDF6B2] px-2 py-0.5 text-xs font-semibold text-foreground dark:bg-warning-subtle dark:text-warning-subtle-foreground"
          >
            {formatTimestampLocal(session.schedule)}
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
          className="inline-flex shrink-0 items-center rounded-lg bg-[#3F83F8] px-3.5 py-2 text-xs font-semibold text-white shadow-[0_4px_14px_-4px_rgb(63_131_248_/_0.6)] transition-all duration-200 ease-out hover:-translate-y-px hover:bg-[#3576e0] hover:shadow-[0_6px_18px_-4px_rgb(63_131_248_/_0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3F83F8] active:translate-y-0 active:scale-95"
        >
          Join Now
        </a>
      )}
    </section>
  )
}
