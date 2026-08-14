'use client'

import { cn } from '@/lib/utils'

/**
 * Seasonal Independence Day dressing for the navbar, gated by
 * `VITE_SHOW_INDEPENDENCE_DAY_UI` (see `isIndependenceDayUiEnabled`).
 *
 * Deliberately quiet: a barely-there saffron/green wash across the header, a
 * hairline tiranga ribbon along its bottom edge with a slow drifting sheen,
 * and a small Ashoka Chakra greeting beside the logo. All hues come from the
 * per-theme `--festive-*` tokens in `styles.css`, so light and dark each get
 * their own tuned tricolor.
 */

/** Ashoka Chakra — 24-spoke wheel, drawn inline so it can spin + theme. */
function AshokaChakra({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn('festive-chakra', className)}
      fill="none"
      stroke="currentColor"
    >
      <circle cx="12" cy="12" r="10.5" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      {Array.from({ length: 24 }, (_, i) => (
        <line
          key={i}
          x1="12"
          y1="3.4"
          x2="12"
          y2="10.2"
          strokeWidth="0.9"
          transform={`rotate(${i * 15} 12 12)`}
        />
      ))}
    </svg>
  )
}

/**
 * Absolute overlay layers (washes + bottom ribbon). Render as the first child
 * of a positioned container (`<header>` is positioned via `sticky`); it is
 * inert (`pointer-events-none`) and purely decorative.
 */
export function IndependenceDayDecor() {
  return (
    <div
      aria-hidden="true"
      data-testid="navbar-independence-decor"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="festive-tiranga-washes absolute inset-0" />
      <div className="festive-tiranga-ribbon absolute inset-x-0 bottom-0 h-1 overflow-hidden">
        {/* Full-width carrier with a narrow highlight; translating it
            -100%→100% sweeps the sheen across the whole ribbon. */}
        <div className="festive-tiranga-sheen absolute inset-0 bg-[linear-gradient(90deg,transparent_38%,rgba(255,255,255,0.75)_50%,transparent_62%)]" />
      </div>
    </div>
  )
}

/**
 * Chakra + greeting rendered beside the logo. Hidden on narrower desktop
 * widths so it never crowds the primary nav items.
 */
export function IndependenceDayGreeting() {
  return (
    <span
      data-testid="navbar-independence-greeting"
      className="hidden shrink-0 select-none items-center gap-1.5 self-center xl:inline-flex"
      title="Happy Independence Day!"
    >
      <AshokaChakra className="size-4 text-[var(--festive-chakra)]" />
      <span className="bg-[linear-gradient(90deg,var(--festive-saffron),var(--festive-chakra)_50%,var(--festive-green))] bg-clip-text text-xs font-semibold tracking-wide text-transparent">
        Happy Independence Day
      </span>
    </span>
  )
}
