import { DownloadSimple, IdentificationCard, Lock } from '@phosphor-icons/react'

interface IdCardStepProps {
  url: string | null
  /** Unlocks once all program videos are watched and agreements signed. */
  unlocked: boolean
}

const CARD = 'flex flex-col items-start gap-4 rounded-xl border border-gray-200 p-6'

/**
 * ID-card capstone: locked until onboarding is complete, then reveals the card
 * (image + download) — or a "being generated" notice while admissions produces it.
 */
export function IdCardStep({ url, unlocked }: IdCardStepProps) {
  if (!unlocked) {
    return (
      <div className={CARD} data-testid="id-card-step">
        <Lock className="size-8 text-gray-400" aria-hidden />
        <p className="text-sm font-medium text-gray-900">Your student ID card is locked</p>
        <p className="text-sm text-gray-600" data-testid="id-card-locked">
          Complete the onboarding steps above to unlock your student ID card.
        </p>
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

  return (
    <div className={CARD} data-testid="id-card-step">
      <p className="text-sm font-medium text-gray-900">Your student ID card is ready</p>
      <img src={url} alt="Student ID card" className="w-full max-w-sm rounded-lg border border-gray-200" data-testid="id-card-image" />
      <a
        href={url}
        download="masai-id-card.png"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#6962AC] px-5 text-sm font-semibold text-white hover:opacity-90"
        data-testid="id-card-download"
      >
        <DownloadSimple className="size-4" aria-hidden />
        Download ID card
      </a>
    </div>
  )
}
