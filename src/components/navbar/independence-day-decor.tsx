'use client'

/**
 * Seasonal Independence Day dressing for the navbar, shown during the date
 * window in `isIndependenceDayUiEnabled`.
 *
 * Deliberately quiet and wordless: a corner-weighted saffron/green wash across
 * the header (whitish through the middle) and a tiranga ribbon along its bottom
 * edge with a slow drifting sheen. No copy, no emblem — the tricolor alone
 * carries the occasion. All hues come from the per-theme `--festive-*` tokens
 * in `styles.css`, so light and dark each get their own tuned tricolor.
 *
 * Renders as the first child of a positioned container (`<header>` is
 * positioned via `sticky`) and is inert (`pointer-events-none`).
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
