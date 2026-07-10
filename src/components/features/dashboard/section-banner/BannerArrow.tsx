import { CaretLeft, CaretRight } from '@phosphor-icons/react'

interface BannerArrowProps {
  direction: 'prev' | 'next'
  onClick: () => void
  /** Accessible label suffix, e.g. "payment banner" → "Previous payment banner". */
  label: string
  /** Testid base, e.g. "dashboard-fee-payment" → "…-prev" / "…-next". */
  testIdBase: string
  /** "dark" for gradient banners (white on translucent), "light" for pale ones. */
  tone: 'dark' | 'light'
}

/**
 * Small round prev/next control for the looping dashboard banner carousels.
 * Placed flanking the dots (not overlaying the slide) so it never covers a
 * banner's CTA. Shown only when a carousel has more than one slide.
 */
export function BannerArrow({ direction, onClick, label, testIdBase, tone }: BannerArrowProps) {
  const isPrev = direction === 'prev'
  const toneCls =
    tone === 'dark'
      ? 'bg-white/15 text-white hover:bg-white/25'
      : 'bg-white text-[#5B478B] shadow-sm hover:bg-white/90'
  return (
    <button
      type="button"
      aria-label={`${isPrev ? 'Previous' : 'Next'} ${label}`}
      data-testid={`${testIdBase}-${direction}`}
      onClick={onClick}
      className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current ${toneCls}`}
    >
      {isPrev ? <CaretLeft size={14} weight="bold" aria-hidden /> : <CaretRight size={14} weight="bold" aria-hidden />}
    </button>
  )
}
