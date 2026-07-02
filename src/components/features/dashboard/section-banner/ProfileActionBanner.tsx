import { Camera, CaretLeft, CaretRight, UserCircle } from '@phosphor-icons/react'

interface ProfileActionBannerProps {
  label: string
  actionLabel?: string
  onAction?: () => void
}

// Purple pill-shaped banner at the top of the dashboard prompting the student
// to complete a profile action. Navigation arrows are static placeholders for
// the eventual multi-banner carousel.
export function ProfileActionBanner({
  label,
  actionLabel = 'Take Photo',
  onAction,
}: ProfileActionBannerProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-[#5B52A3] to-[#6E66B8] px-6 py-4 text-white">
      <div className="flex min-w-0 items-center gap-3">
        <UserCircle size={22} weight="bold" className="shrink-0" />
        <span className="truncate text-sm font-semibold md:text-base">{label}</span>
        <button
          type="button"
          onClick={onAction}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#5B52A3] transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Camera size={16} weight="bold" />
          {actionLabel}
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className="hidden items-center gap-1.5 md:flex" aria-hidden="true">
          <span className="size-1.5 rounded-full bg-white" />
          <span className="size-1.5 rounded-full bg-white/40" />
          <span className="size-1.5 rounded-full bg-white/40" />
        </span>
        <BannerNavButton label="Previous banner">
          <CaretLeft size={16} weight="bold" />
        </BannerNavButton>
        <BannerNavButton label="Next banner">
          <CaretRight size={16} weight="bold" />
        </BannerNavButton>
      </div>
    </div>
  )
}

function BannerNavButton({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="inline-flex size-8 items-center justify-center rounded-lg bg-white/20 text-white transition-colors hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      {children}
    </button>
  )
}
