import { useEffect, useMemo, useState } from 'react'

import { ChevronDown, ChevronRight } from 'lucide-react'

import type { DrawerDirection } from '@/components/ui/masai-drawer'
import { MasaiChips } from '@/components/ui/masai-chips'
import { MasaiDrawer } from '@/components/ui/masai-drawer'

interface LearnBatchOption {
  value: string
  label: string
  courseLogo: string | null
}

interface LearnHeaderSectionProps {
  selectedBatch: string
  batches: Array<LearnBatchOption>
  onBatchChange: (batch: string) => void
  // TODO: Re-enable when Attendance Report and Course Details pages are ready.
  // attendanceReportHref?: string
  // courseDetailsHref?: string
}

export function LearnHeaderSection({
  selectedBatch,
  batches,
  onBatchChange,
  // TODO: Re-enable when Attendance Report and Course Details pages are ready.
  // attendanceReportHref = '#',
  // courseDetailsHref = '#',
}: LearnHeaderSectionProps) {
  const [isBatchDrawerOpen, setIsBatchDrawerOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)')
    const syncViewport = () => setIsDesktop(mediaQuery.matches)
    syncViewport()
    mediaQuery.addEventListener('change', syncViewport)
    return () => mediaQuery.removeEventListener('change', syncViewport)
  }, [])

  const selectedBatchLabel = useMemo(
    () =>
      batches.find((batch) => batch.value === selectedBatch)?.label ??
      'Select batch',
    [batches, selectedBatch],
  )

  const drawerDirection: DrawerDirection = isDesktop ? 'right' : 'bottom'

  return (
    <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div
        className="flex cursor-pointer items-center justify-between gap-3"
        onClick={() => setIsBatchDrawerOpen(true)}
      >
        <h4 className="type-h4">{selectedBatchLabel}</h4>
        <MasaiChips
          type="icon-only"
          size="large"
          icon={<ChevronDown size={20} />}
          aria-label="Open batch selection drawer"
        />
      </div>

      <MasaiDrawer
        isOpen={isBatchDrawerOpen}
        onOpenChange={setIsBatchDrawerOpen}
        direction={drawerDirection}
        sideMarginInPx={isDesktop ? 16 : undefined}
        title="Select a course"
        content={
          <div className="flex flex-col gap-3 pb-2">
            {batches.map((batch) => {
              const isSelected = batch.value === selectedBatch
              return (
                <button
                  key={batch.value}
                  type="button"
                  onClick={() => {
                    onBatchChange(batch.value)
                    setIsBatchDrawerOpen(false)
                  }}
                  className={`flex w-full items-center gap-4 rounded-xl border px-4 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-400/40'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    {batch.courseLogo ? (
                      <img
                        src={batch.courseLogo}
                        alt=""
                        className="h-10 w-auto max-w-[140px] object-contain object-left"
                      />
                    ) : null}
                    <span className="type-b1-md font-semibold text-slate-900">{batch.label}</span>
                  </div>
                  <ChevronRight
                    className="size-5 shrink-0 text-gray-500"
                    strokeWidth={2}
                    aria-hidden
                  />
                </button>
              )
            })}
          </div>
        }
      />

      {/*
        TODO: Re-enable when Attendance Report and Course Details pages are ready.
        <div className="flex items-center gap-4">
          <a
            href={attendanceReportHref}
            className="type-b1-md text-primary-500 hover:underline"
          >
            Attendance Report
          </a>
          <div className="h-4 w-[1px] bg-gray-300" />
          <a
            href={courseDetailsHref}
            className="type-b1-md text-primary-500 hover:underline"
          >
            Course Details
          </a>
        </div>
      */}
    </section>
  )
}
