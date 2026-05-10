import { useEffect, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { DrawerDirection } from '@/components/ui/masai-drawer'
import { MasaiChips } from '@/components/ui/masai-chips'
import { MasaiDrawer } from '@/components/ui/masai-drawer'
import { Separator } from '@/components/ui/separator'

interface LearnBatchOption {
  value: string
  label: string
}

interface LearnHeaderSectionProps {
  selectedBatch: string
  batches: Array<LearnBatchOption>
  onBatchChange: (batch: string) => void
  attendanceReportHref?: string
  courseDetailsHref?: string
}

export function LearnHeaderSection({
  selectedBatch,
  batches,
  onBatchChange,
  attendanceReportHref = '#',
  courseDetailsHref = '#',
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
    <section className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
      <div
        className="flex items-center justify-between gap-3 cursor-pointer"
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
        title="Select course"
        content={
          <div className="space-y-2">
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
                  className={`w-full rounded-md border px-4 py-3 text-left text-sm transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  {batch.label}
                </button>
              )
            })}
          </div>
        }
      />

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
    </section>
  )
}
