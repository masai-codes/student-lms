'use client'

/** Widths that loosely mirror real transcript lines, so the swap isn't jarring. */
const SKELETON_LINE_WIDTHS = ['92%', '78%', '85%', '64%', '88%', '72%']

/** Shown while the transcript is fetched from its cached endpoint. */
export function LectureTranscriptSkeleton() {
  return (
    <div
      data-testid="lecture-transcript-skeleton"
      className="flex flex-col gap-3"
      aria-busy="true"
    >
      <span className="sr-only">Loading transcript…</span>
      {SKELETON_LINE_WIDTHS.map((width, index) => (
        <div
          key={width}
          className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3"
          style={
            {
              '--dash-delay': `${index * 0.05}s`,
            } as React.CSSProperties
          }
        >
          <div className="dash-skeleton h-4 w-12 shrink-0 rounded" />
          <div className="dash-skeleton h-4 rounded" style={{ width }} />
        </div>
      ))}
    </div>
  )
}
