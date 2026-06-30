import { Ban, TriangleAlert } from 'lucide-react'
import type { PaymentBannerInfo } from '@/server/api/dashboard/getPaymentBannerInfo.service'
import { OLD_STUDENT_UI_NAV_PATHS } from '@/constants/oldStudentUiNavPaths'
import { getOldStudentUiUrlForPath } from '@/utils/authRedirect'

const STYLES = {
  trial: {
    wrapper: { background: '#FFF5EE', border: '1px solid #F5D5C0' },
    badge: { background: '#E76E4B', color: '#fff' },
  },
  overdue: {
    wrapper: { background: '#FDF4F6', border: '1px solid #F5C6CE' },
    badge: { background: '#DC3545', color: '#fff' },
  },
  banned: {
    wrapper: { background: '#FEFCE8', border: '1px solid #FDE68A' },
  },
} as const

interface Props {
  info: PaymentBannerInfo
}

export function PaymentBanner({ info }: Props) {
  const { type, daysRemaining, paymentUrl } = info

  // ── Banned state ────────────────────────────────────────────────────────────
  if (type === 'banned') {
    return (
      <div
        className="rounded-2xl px-4 py-3 lg:px-5 lg:py-3.5 flex items-center gap-3"
        style={{ ...STYLES.banned.wrapper, fontFamily: 'Poppins' }}
      >
        <Ban size={20} className="shrink-0 text-[#DC3545]" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1F1F1F] leading-snug">
            Your LMS account is currently banned
          </p>
          <p className="text-xs text-[#6B7280] mt-0.5 leading-snug">
            To regain full access, please contact admin via raising a support
            ticket. You can continue viewing your past content in the meantime.
          </p>
        </div>
        <a
          href={
            getOldStudentUiUrlForPath(OLD_STUDENT_UI_NAV_PATHS.support) ?? '#'
          }
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none whitespace-nowrap"
          style={{ background: '#6962AC' }}
        >
          Raise a Ticket
        </a>
      </div>
    )
  }

  // ── Trial / Overdue states ───────────────────────────────────────────────────
  const s = STYLES[type]
  const isOverdue = type === 'overdue'
  const badge = `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining`

  const ctaButton = (
    <a
      href={paymentUrl || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none whitespace-nowrap"
      style={{ background: '#6962AC', fontFamily: 'Poppins' }}
    >
      <span className="hidden sm:inline">Unlock Full Access</span>
      <span className="sm:hidden">Unlock</span>
    </a>
  )

  return (
    <div
      className="rounded-2xl px-4 py-3"
      style={{ ...s.wrapper, fontFamily: 'Poppins' }}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="flex items-start gap-1.5">
            {isOverdue && (
              <TriangleAlert
                size={15}
                className="shrink-0 mt-0.5"
                style={{ color: '#DC3545' }}
              />
            )}
            <p className="text-sm font-semibold text-[#1F1F1F] leading-snug">
              {isOverdue
                ? 'Payment Overdue! Complete the payment to avoid course deactivation'
                : 'Pay your remaining program fee to avoid interruption'}
            </p>
          </div>
          <span
            className="self-start px-3 py-1 rounded-full text-xs font-semibold"
            style={s.badge}
          >
            {badge}
          </span>
        </div>
        {ctaButton}
      </div>
    </div>
  )
}
