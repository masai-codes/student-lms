import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'

import {
  Check,
  ChevronDown,
  ExternalLink,
  GraduationCapIcon,
} from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { pushLearnEvent } from '../shared/learnAnalytics'
import { getOldStudentUiUrlForPath } from '@/utils/authRedirect'
import { Tooltip, TooltipContent } from '@/components/ui/tooltip'
import { TooltipTrigger } from '@radix-ui/react-tooltip'
import { getLastSelectedBatchIdForUser } from '@/lib/learnBatchSelection'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchLearnPageDataFromApi } from '@/lib/api/learn/learnApi'

interface LearnBatchSwitcherProps {
  /** `true` renders the compact navbar Tier 2 pill instead of the page-header title style. */
  compact?: boolean
}

const layoutRouteApi = getRouteApi('/(protected)/_layout')

/**
 * Program/course picker. Rendered twice — once inline as a page-header title
 * (mobile, no Tier 2 nav yet) and once `compact` in the desktop navbar's
 * Tier 2 row. Always rendered, even for a student with a single enrolled
 * program — the picker doubles as the current-program indicator.
 */
export function LearnBatchSwitcher({
  compact = false,
}: LearnBatchSwitcherProps) {
  const { user } = layoutRouteApi.useRouteContext()
  const navigate = useNavigate()

  const [isBatchMenuOpen, setIsBatchMenuOpen] = useState(false)
  const lastSelectedBatchId = getLastSelectedBatchIdForUser(user.id)
  const lastSelectedBatchIdNumber = lastSelectedBatchId
    ? Number(lastSelectedBatchId)
    : undefined
  const { data } = useQuery({
    queryKey: ['learn-tier2-fallback-batches', lastSelectedBatchIdNumber],
    queryFn: () =>
      fetchLearnPageDataFromApi({
        batchId: lastSelectedBatchIdNumber,
        learningType: 'lecture',
        page: 1,
      }),
    staleTime: 5 * 60 * 1000,
  })
  const batches = data?.batches.map((batch) => ({
    value: batch.batchId.toString(),
    label: batch.courseTitle,
    courseLogo: batch.courseLogo,
    showBatchDetails: batch.showBatchDetails,
    showSectionDropdown: batch.showSectionDropdown,
  }))

  const selectedBatch = (data?.selectedBatchId ?? '').toString()
  const selectedBatchOption = useMemo(
    () => batches?.find((batch) => batch.value === selectedBatch),
    [batches, selectedBatch],
  )
  if (!data) return null

  const onBatchChange = (batchId: string) => {
    // if (isDiscussions) {
    //   void navigate({
    //     to: '/learn/discussions',
    //     search: { batchId: Number(batchId) },
    //   })
    //   return
    // }
    void navigate({ to: '/learn', search: { batchId: Number(batchId) } })
  }

  const selectedBatchLabel = selectedBatchOption?.label ?? 'Select batch'
  const programUrl =
    selectedBatchOption?.showBatchDetails &&
    getOldStudentUiUrlForPath(`/new-courses/${selectedBatch}`)

  return (
    <>
      <DropdownMenu open={isBatchMenuOpen} onOpenChange={setIsBatchMenuOpen}>
        <DropdownMenuTrigger asChild>
          {compact ? (
            <button
              type="button"
              aria-label="Open program selection"
              className="group flex h-8 min-w-0 max-w-[220px] cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0 truncate">
                <GraduationCapIcon className="inline size-4 mr-1" />{' '}
                {selectedBatchLabel}
              </span>
              <ChevronDown
                className={`size-4 shrink-0 text-foreground-muted transition-transform duration-200 ${
                  isBatchMenuOpen ? 'rotate-180' : ''
                }`}
                aria-hidden
              />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Open batch selection"
              className="group flex min-w-0 cursor-pointer items-center gap-3 rounded-lg text-left transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 active:scale-[0.98]"
            >
              <h4 className="type-h4 min-w-0 break-words">
                {selectedBatchLabel}
              </h4>
              <span
                className="flex shrink-0 items-center justify-center rounded-full bg-blue-50 p-2 text-blue-500 transition-colors group-hover:bg-blue-100 dark:bg-info-subtle dark:text-info-subtle-foreground dark:group-hover:bg-info-subtle"
                aria-hidden
              >
                <ChevronDown
                  className={`size-4 transition-transform duration-200 ${
                    isBatchMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </span>
            </button>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="max-h-[min(60vh,420px)] w-[min(92vw,360px)] overflow-y-auto rounded-xl border border-border bg-surface p-2 shadow-lg"
        >
          <DropdownMenuLabel className="text-foreground">
            Select a program
          </DropdownMenuLabel>
          {batches?.map((batch, index) => {
            const isSelected = batch.value === selectedBatch
            return (
              <DropdownMenuItem
                key={batch.value}
                onSelect={() => {
                  pushLearnEvent('l_learn_batch_change_id_' + batch.value, {
                    batch_id: batch.value,
                    batch_label: batch.label,
                  })
                  onBatchChange(batch.value)
                }}
                style={{ '--dash-delay': `${index * 0.04}s` } as CSSProperties}
                className={`animate-dash-row-in cursor-pointer items-start gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-brand/5 focus:bg-brand/5 ${
                  isSelected ? 'bg-brand/5' : ''
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
                  <span
                    className={`type-b1-md break-words font-semibold ${
                      isSelected ? 'text-brand' : 'text-foreground'
                    }`}
                  >
                    {batch.label}
                  </span>
                </div>
                {isSelected ? (
                  <Check
                    className="mt-0.5 size-5 shrink-0 text-brand"
                    strokeWidth={2}
                    aria-hidden
                  />
                ) : null}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      {programUrl && (
        <Tooltip>
          <TooltipContent>View Program Details</TooltipContent>
          <TooltipTrigger>
            <a
              href={programUrl}
              target="_blank"
              data-testid="program-details-link"
              rel="noopener noreferrer"
            >
              <ExternalLink size={18} />
            </a>
          </TooltipTrigger>
        </Tooltip>
      )}
    </>
  )
}
