import { LearnContentListSkeleton } from './section-three/LearnContentListSkeleton'

/** Initial-load placeholder for `/learn` — mirrors the header, controls and list. */
export function LearnPageSkeleton() {
  return (
    <div className="mt-[-24px] w-full">
      <div className="ml-[calc(50%-50vw)] w-screen max-w-[100vw] overflow-x-clip rounded-b-[32px] bg-surface">
        <div className="layout-max-w layout-gutter-x mx-auto w-full pt-[20px]">
          <div className="dash-skeleton h-7 w-56 max-w-full rounded-md" />

          {/* Mirrors LearnControlsSection: tabs above the controls on small
              screens, one row from `md` up (no fixed widths that overflow). */}
          <div className="flex flex-col gap-3 py-5 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-4">
              <div className="dash-skeleton h-9 w-24 rounded-full" />
              <div
                className="dash-skeleton h-9 w-28 rounded-full"
                style={{ animationDelay: '0.1s' }}
              />
              <div
                className="dash-skeleton h-9 w-24 rounded-full"
                style={{ animationDelay: '0.2s' }}
              />
            </div>
            <div className="flex w-full min-w-0 flex-wrap items-center gap-3 md:ml-auto md:w-auto md:justify-end">
              <div className="dash-skeleton h-11 w-full rounded-lg sm:w-[300px]" />
              <div
                className="dash-skeleton h-11 min-w-[150px] flex-1 rounded-lg sm:w-[170px] sm:flex-none"
                style={{ animationDelay: '0.1s' }}
              />
              <div
                className="dash-skeleton size-11 shrink-0 rounded-lg"
                style={{ animationDelay: '0.2s' }}
              />
            </div>
          </div>
        </div>
      </div>

      <LearnContentListSkeleton />
    </div>
  )
}
