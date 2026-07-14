/** A few placeholder cards is enough of a loading hint; the real page holds more. */
const DEFAULT_SKELETON_COUNT = 6

/** Shimmer placeholder matching `LearnContentCard`'s footprint (icon + title + meta + tags). */
function LearnContentCardSkeleton({ delaySeconds }: { delaySeconds: number }) {
  // Offsetting the shimmer per card keeps the list from strobing in unison.
  const shimmer = { animationDelay: `${delaySeconds}s` }

  return (
    <div className="bg-surface rounded-[8px] border border-border p-3">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <div
            className="dash-skeleton size-10 shrink-0 rounded-md"
            style={shimmer}
          />
          <div className="space-y-2">
            <div
              className="dash-skeleton h-5 w-48 max-w-full rounded-md"
              style={shimmer}
            />
            <div
              className="dash-skeleton h-4 w-40 max-w-full rounded-md"
              style={shimmer}
            />
            <div className="flex gap-2 pt-1">
              <div
                className="dash-skeleton h-6 w-16 rounded-full"
                style={shimmer}
              />
              <div
                className="dash-skeleton h-6 w-20 rounded-full"
                style={shimmer}
              />
              <div
                className="dash-skeleton h-6 w-24 rounded-full"
                style={shimmer}
              />
            </div>
          </div>
        </div>
        <div
          className="dash-skeleton h-8 w-28 self-start rounded-full md:self-center"
          style={shimmer}
        />
      </div>
    </div>
  )
}

export function LearnContentListSkeleton({
  count = DEFAULT_SKELETON_COUNT,
}: {
  count?: number
}) {
  return (
    <section
      className="mt-[16px] space-y-3"
      aria-busy="true"
      aria-label="Loading items"
    >
      {Array.from({ length: count }).map((_, index) => (
        <LearnContentCardSkeleton key={index} delaySeconds={index * 0.08} />
      ))}
    </section>
  )
}
