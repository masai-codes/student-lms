import { DownloadSimple, IdentificationCard, Lock } from '@phosphor-icons/react'
import { pushDashboardEvent } from '../../shared/dashboardAnalytics'

interface IdCardStepProps {
  url: string | null
  /** Unlocks once all program videos are watched and agreements signed. */
  unlocked: boolean
}

const CARD = 'flex flex-col items-start gap-4 rounded-xl border border-gray-200 bg-white p-6'

/** A blurred faux ID card shown behind the lock while the real one is unavailable. */
function BlurredCardPreview() {
  return (
    <div className="absolute inset-0 blur-[3px]" aria-hidden>
      <div className="flex h-full w-full flex-col gap-2 bg-gradient-to-br from-gray-100 to-gray-200 p-3">
        <div className="flex gap-2">
          <div className="size-10 shrink-0 rounded-md bg-gray-300" />
          <div className="flex flex-1 flex-col gap-1.5 pt-1">
            <div className="h-2 w-3/4 rounded bg-gray-300" />
            <div className="h-2 w-1/2 rounded bg-gray-300" />
          </div>
        </div>
        <div className="mt-1 h-2 w-full rounded bg-gray-300" />
        <div className="h-2 w-5/6 rounded bg-gray-300" />
        <div className="h-2 w-2/3 rounded bg-gray-300" />
      </div>
    </div>
  )
}

/** The admissions URL can be a PDF admit card or an image ID card — render each accordingly. */
function isPdfUrl(url: string): boolean {
  return /\.pdf(?:[?#]|$)/i.test(url)
}

/**
 * ID-card capstone: locked until onboarding is complete (a blurred card preview
 * behind a lock), then reveals the real card from the DB — image or embedded PDF,
 * plus a download — or a "being generated" notice while admissions produces it.
 */
export function IdCardStep({ url, unlocked }: IdCardStepProps) {
  if (!unlocked) {
    return (
      <div
        className="flex flex-col items-center gap-4 rounded-2xl bg-[#EEF2FF] p-5 sm:flex-row sm:gap-6"
        data-testid="id-card-locked"
      >
        <div className="relative h-[130px] w-[200px] shrink-0 overflow-hidden rounded-xl border border-white/60 shadow-sm">
          <BlurredCardPreview />
          <div className="absolute inset-0 flex items-center justify-center bg-white/10">
            <span className="flex size-14 items-center justify-center rounded-full bg-[#6962AC] shadow-md">
              <Lock size={26} weight="fill" className="text-white" aria-hidden />
            </span>
          </div>
        </div>
        <div className="text-center sm:text-left">
          <h3 className="text-lg font-bold text-gray-900">ID Card</h3>
          <p className="mt-1 text-sm text-gray-600">Complete the above steps to unlock your ID card</p>
        </div>
      </div>
    )
  }

  if (!url) {
    return (
      <div className={CARD} data-testid="id-card-step">
        <IdentificationCard className="size-8 text-[#6962AC]" aria-hidden />
        <p className="text-sm font-medium text-gray-900">Your ID card is being generated</p>
        <p className="text-sm text-gray-600" data-testid="id-card-generating">
          We&apos;re verifying your details — your ID card will be ready within 30 minutes.
        </p>
      </div>
    )
  }

  const isPdf = isPdfUrl(url)

  return (
    <div className={CARD} data-testid="id-card-step">
      <p className="text-sm font-medium text-gray-900">Your student ID card is ready</p>
      {isPdf ? (
        <iframe
          src={`${url}#toolbar=0`}
          title="Student ID card"
          className="h-[420px] w-full max-w-sm rounded-lg border border-gray-200"
          data-testid="id-card-pdf"
        />
      ) : (
        <img src={url} alt="Student ID card" className="w-full max-w-sm rounded-lg border border-gray-200" data-testid="id-card-image" />
      )}
      <a
        href={url}
        download={isPdf ? 'masai-id-card.pdf' : 'masai-id-card.png'}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => pushDashboardEvent('l_dashboard_guided_tour_id_card_download')}
        className="inline-flex h-11 items-center justify-center gap-2 self-center rounded-lg bg-[#6962AC] px-5 text-sm font-semibold text-white hover:opacity-90"
        data-testid="id-card-download"
      >
        <DownloadSimple className="size-4" aria-hidden />
        Download ID card
      </a>
    </div>
  )
}
