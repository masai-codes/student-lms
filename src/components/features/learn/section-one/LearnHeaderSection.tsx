import { useEffect, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { MasaiDrawer, type DrawerDirection } from '@/components/ui/masai-drawer'

interface LearnBatchOption {
  value: string
  label: string
}

interface LearnHeaderSectionProps {
  selectedBatch: string
  batches: Array<LearnBatchOption>
  onBatchChange: (batch: string) => void
}

export function LearnHeaderSection({
  selectedBatch,
  batches,
  onBatchChange,
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
    () => batches.find((batch) => batch.value === selectedBatch)?.label ?? 'Select batch',
    [batches, selectedBatch],
  )

  const drawerDirection: DrawerDirection = isDesktop ? 'right' : 'bottom'

  return (
    <section className="flex flex-col gap-4 rounded-lg border bg-card p-4 md:flex-row md:items-center md:justify-between">
      <button
        type="button"
        onClick={() => setIsBatchDrawerOpen(true)}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-left text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground md:w-[300px]"
      >
        <span className="truncate">{selectedBatchLabel}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>

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

      <div className="flex items-center gap-4 text-sm font-medium">
        <button type="button" className="text-primary hover:underline">
          Attendance Report
        </button>
        <button type="button" className="text-primary hover:underline">
          Course Details
        </button>
      </div>
    </section>
  )
}
