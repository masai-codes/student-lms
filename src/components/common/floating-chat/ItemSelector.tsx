import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { MagnifyingGlass, CaretRight, CaretLeft } from '@phosphor-icons/react'
import type { Category, Item } from './types'
import {
  formatSupportLectureTypeLabel,
  supportAssignmentPriorityChipClassName,
  supportLectureTypeChipClassName,
} from './supportCategoryLearning'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ItemSelectorPagination {
  page: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
  onPageChange: (page: number) => void
}

interface ItemSelectorSection {
  sectionId: number
  name: string
}

interface ItemSelectorProps {
  categoryObj: Category
  items: Item[]
  search: string
  onSearchChange: (value: string) => void
  onSelect: (item: Item) => void
  isLoading?: boolean
  isPageLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  pagination?: ItemSelectorPagination
  /** Section (aka "Course") filter — opt-in per batch (`batches.meta.showSectionDropdown`). */
  showSectionDropdown?: boolean
  sections?: Array<ItemSelectorSection>
  /** `null` when "All Courses" is active. */
  selectedSectionId?: number | null
  onSectionChange?: (sectionId: number | null) => void
  lectureTypeFilter?: string
  onLectureTypeChange?: (value: string) => void
  attendanceStatusFilter?: string
  onAttendanceStatusChange?: (value: string) => void
  assignmentPriorityFilter?: string
  onAssignmentPriorityChange?: (value: string) => void
  assignmentCategoryFilter?: string
  onAssignmentCategoryChange?: (value: string) => void
  assignmentCategoryOptions?: Array<string>
  assignmentModuleFilter?: string
  onAssignmentModuleChange?: (value: string) => void
  assignmentModuleOptions?: Array<string>
  evaluationProgressFilter?: string
  onEvaluationProgressChange?: (value: string) => void
  evaluationModuleFilter?: string
  onEvaluationModuleChange?: (value: string) => void
  evaluationModuleOptions?: Array<string>
}

export function ItemSelector({
  categoryObj,
  items,
  search,
  onSearchChange,
  onSelect,
  isLoading = false,
  isPageLoading = false,
  isError = false,
  onRetry,
  pagination,
  showSectionDropdown = false,
  sections = [],
  selectedSectionId = null,
  onSectionChange,
  lectureTypeFilter,
  onLectureTypeChange,
  attendanceStatusFilter,
  onAttendanceStatusChange,
  assignmentPriorityFilter,
  onAssignmentPriorityChange,
  assignmentCategoryFilter,
  onAssignmentCategoryChange,
  assignmentCategoryOptions = [],
  assignmentModuleFilter,
  onAssignmentModuleChange,
  assignmentModuleOptions = [],
  evaluationProgressFilter,
  onEvaluationProgressChange,
  evaluationModuleFilter,
  onEvaluationModuleChange,
  evaluationModuleOptions = [],
}: ItemSelectorProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const showPagination =
    pagination != null && (pagination.hasPreviousPage || pagination.hasNextPage)
  // Falls back to "All Courses" for a stale/unknown section id (e.g. right
  // after a batch switch, before the caller clears it).
  const sectionValue =
    selectedSectionId != null &&
    sections.some((section) => section.sectionId === selectedSectionId)
      ? selectedSectionId.toString()
      : 'any'

  useEffect(() => {
    if (pagination == null) return
    listRef.current?.scrollTo({ top: 0 })
  }, [pagination?.page])

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center gap-2 bg-[#f1f1f7] dark:bg-muted rounded-[10px] p-[10px_12px] shrink-0 mb-1">
        <MagnifyingGlass
          weight="bold"
          className="size-4 text-[#9496ab] dark:text-foreground-subtle shrink-0"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={`Search ${categoryObj.label.toLowerCase()}s...`}
          className="flex-1 bg-transparent outline-none border-none text-[13.6px] text-[#15162c] dark:text-foreground placeholder:text-[#9496ab] dark:placeholder:text-foreground-subtle font-[inherit]"
        />
      </div>

      {showSectionDropdown && onSectionChange && (
        <div className="shrink-0 mb-1">
          <Select
            value={sectionValue}
            onValueChange={(value) =>
              onSectionChange(value === 'any' ? null : Number(value))
            }
            disabled={sections.length === 0}
          >
            <SelectTrigger className="h-[34px] w-full text-[13px] bg-[#f1f1f7] dark:bg-muted border-transparent hover:bg-[#e3e3fb] dark:hover:bg-brand/15 transition-colors rounded-[10px]">
              <SelectValue placeholder="Course" />
            </SelectTrigger>
            <SelectContent className="z-[300]">
              <SelectItem value="any">All Courses</SelectItem>
              {sections.map((section) => (
                <SelectItem
                  key={section.sectionId}
                  value={section.sectionId.toString()}
                >
                  {section.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {categoryObj.id === 'lecture' &&
        onLectureTypeChange &&
        onAttendanceStatusChange && (
          <div className="flex items-center gap-2 mb-1 shrink-0">
            <Select
              value={lectureTypeFilter}
              onValueChange={onLectureTypeChange}
            >
              <SelectTrigger className="h-[34px] flex-1 text-[13px] bg-[#f1f1f7] dark:bg-muted border-transparent hover:bg-[#e3e3fb] dark:hover:bg-brand/15 transition-colors rounded-[10px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="z-[300]">
                <SelectItem value="any">All types</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="scrum">Scrum</SelectItem>
                <SelectItem value="video">Video</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={attendanceStatusFilter}
              onValueChange={onAttendanceStatusChange}
            >
              <SelectTrigger className="h-[34px] flex-1 text-[13px] bg-[#f1f1f7] dark:bg-muted border-transparent hover:bg-[#e3e3fb] dark:hover:bg-brand/15 transition-colors rounded-[10px]">
                <SelectValue placeholder="Attendance" />
              </SelectTrigger>
              <SelectContent className="z-[300]">
                <SelectItem value="any">All attendance</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

      {categoryObj.id === 'assignment' &&
        onAssignmentPriorityChange &&
        onAssignmentCategoryChange &&
        onAssignmentModuleChange && (
          <div className="flex flex-col gap-1.5 mb-1 shrink-0 min-w-0 lg:flex-row lg:items-center">
            <div className="flex items-center gap-1.5 min-w-0 lg:contents">
              <Select
                value={assignmentPriorityFilter}
                onValueChange={onAssignmentPriorityChange}
              >
                <SelectTrigger className="h-[34px] min-w-0 flex-1 text-[12px] bg-[#f1f1f7] dark:bg-muted border-transparent hover:bg-[#e3e3fb] dark:hover:bg-brand/15 transition-colors rounded-[10px] px-2">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="z-[300]">
                  <SelectItem value="any">All priorities</SelectItem>
                  <SelectItem value="recommended">Optional</SelectItem>
                  <SelectItem value="mandatory">Mandatory</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={assignmentCategoryFilter}
                onValueChange={onAssignmentCategoryChange}
              >
                <SelectTrigger className="h-[34px] min-w-0 flex-1 text-[12px] bg-[#f1f1f7] dark:bg-muted border-transparent hover:bg-[#e3e3fb] dark:hover:bg-brand/15 transition-colors rounded-[10px] px-2">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="z-[300]">
                  <SelectItem value="any">All categories</SelectItem>
                  {assignmentCategoryOptions.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full lg:contents">
              <Select
                value={assignmentModuleFilter}
                onValueChange={onAssignmentModuleChange}
              >
                <SelectTrigger className="h-[34px] w-full min-w-0 lg:flex-1 text-[12px] bg-[#f1f1f7] dark:bg-muted border-transparent hover:bg-[#e3e3fb] dark:hover:bg-brand/15 transition-colors rounded-[10px] px-2">
                  <SelectValue placeholder="Module" />
                </SelectTrigger>
                <SelectContent className="z-[300]">
                  <SelectItem value="any">All modules</SelectItem>
                  {assignmentModuleOptions.map((moduleName) => (
                    <SelectItem key={moduleName} value={moduleName}>
                      {moduleName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

      {categoryObj.id === 'evaluation' &&
        onEvaluationProgressChange &&
        onEvaluationModuleChange && (
          <div className="flex items-center gap-2 mb-1 shrink-0">
            <Select
              value={evaluationProgressFilter}
              onValueChange={onEvaluationProgressChange}
            >
              <SelectTrigger className="h-[34px] flex-1 text-[13px] bg-[#f1f1f7] dark:bg-muted border-transparent hover:bg-[#e3e3fb] dark:hover:bg-brand/15 transition-colors rounded-[10px]">
                <SelectValue placeholder="Progress" />
              </SelectTrigger>
              <SelectContent className="z-[300]">
                <SelectItem value="any">All progress</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={evaluationModuleFilter}
              onValueChange={onEvaluationModuleChange}
            >
              <SelectTrigger className="h-[34px] flex-1 text-[13px] bg-[#f1f1f7] dark:bg-muted border-transparent hover:bg-[#e3e3fb] dark:hover:bg-brand/15 transition-colors rounded-[10px]">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent className="z-[300]">
                <SelectItem value="any">All modules</SelectItem>
                {evaluationModuleOptions.map((moduleName) => (
                  <SelectItem key={moduleName} value={moduleName}>
                    {moduleName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

      {isLoading && (
        <div className="flex flex-1 items-center justify-center py-8">
          <p className="text-[13px] text-[#62647d] dark:text-foreground-muted">
            Loading {categoryObj.label.toLowerCase()}s…
          </p>
        </div>
      )}

      {isError && !isLoading && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
          <p className="text-[13px] text-[#62647d] dark:text-foreground-muted">
            Couldn&apos;t load {categoryObj.label.toLowerCase()}s.
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-[10px] border border-[#e9e9f3] dark:border-border bg-surface px-4 py-2 text-[13px] font-bold text-[#15162c] dark:text-foreground hover:bg-[#f0f0fd] dark:hover:bg-brand/10"
            >
              Try again
            </button>
          )}
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
          <p className="text-[14px] font-bold text-[#15162c] dark:text-foreground">
            No {categoryObj.label.toLowerCase()}s found
          </p>
          <p className="text-[12.5px] text-[#62647d] dark:text-foreground-muted">
            {search.trim()
              ? 'Try a different search term.'
              : 'Nothing is available for this batch yet.'}
          </p>
        </div>
      )}

      {!isLoading && !isError && items.length > 0 && (
        <div className="flex flex-col flex-1 min-h-0">
          <div
            ref={listRef}
            className={cn(
              'flex flex-col flex-1 overflow-y-auto transition-opacity duration-150',
              isPageLoading && 'pointer-events-none opacity-60',
            )}
          >
            {items.map((item) => {
              const lectureTypeLabel =
                categoryObj.id === 'lecture'
                  ? formatSupportLectureTypeLabel(item.type)
                  : null
              const showOptional =
                (categoryObj.id === 'assignment' ||
                  categoryObj.id === 'evaluation' ||
                  categoryObj.id === 'resource' ||
                  categoryObj.id === 'lecture') &&
                item.isOptional === true
              const showMandatory =
                (categoryObj.id === 'assignment' ||
                  categoryObj.id === 'evaluation' ||
                  categoryObj.id === 'lecture') &&
                item.isMandatory === true
              const showModulePill =
                (categoryObj.id === 'assignment' ||
                  categoryObj.id === 'evaluation') &&
                item.moduleName
              const showSectionPill = showSectionDropdown && item.sectionName

              return (
                <button
                  key={item.id ?? item.title}
                  type="button"
                  onClick={() => onSelect(item)}
                  className="flex w-full items-center gap-3 p-[11px_10px] rounded-[10px] cursor-pointer transition-colors hover:bg-[#f0f0fd] dark:hover:bg-brand/10 mb-[3px] group text-left"
                >
                  <div className="flex items-center justify-center shrink-0 size-[34px] rounded-[9px] bg-[#f1f1f7] dark:bg-muted text-[#62647d] dark:text-foreground-muted group-hover:bg-[#e3e3fb] dark:group-hover:bg-brand/15 group-hover:text-[#4b4396] dark:group-hover:text-brand transition-colors">
                    <categoryObj.icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <strong className="block text-[13.6px] font-semibold text-[#15162c] dark:text-foreground truncate">
                      {item.title}
                    </strong>
                    <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                      {lectureTypeLabel ? (
                        <span
                          className={cn(
                            'text-[11px] font-bold px-2 py-[2.5px] rounded-full shrink-0',
                            supportLectureTypeChipClassName(item.type),
                          )}
                        >
                          {lectureTypeLabel}
                        </span>
                      ) : null}
                      {showMandatory ? (
                        <span
                          className={cn(
                            'text-[11px] font-bold px-2 py-[2.5px] rounded-full shrink-0',
                            supportAssignmentPriorityChipClassName('mandatory'),
                          )}
                        >
                          Mandatory
                        </span>
                      ) : null}
                      {showOptional ? (
                        <span
                          className={cn(
                            'text-[11px] font-bold px-2 py-[2.5px] rounded-full shrink-0',
                            supportAssignmentPriorityChipClassName('optional'),
                          )}
                        >
                          Optional
                        </span>
                      ) : null}
                      <span className="text-[11px] font-bold text-[#62647d] dark:text-foreground-muted bg-[#f1f1f7] dark:bg-muted px-2 py-[2.5px] rounded-full group-hover:bg-surface transition-colors truncate max-w-[140px]">
                        {item.meta}
                      </span>
                      {showModulePill ? (
                        <span className="text-[11px] font-bold text-[#62647d] dark:text-foreground-muted bg-[#f1f1f7] dark:bg-muted px-2 py-[2.5px] rounded-full group-hover:bg-surface transition-colors truncate max-w-[140px]">
                          {item.moduleName}
                        </span>
                      ) : null}
                      {showSectionPill ? (
                        <span className="text-[11px] font-bold text-[#62647d] dark:text-foreground-muted bg-[#f1f1f7] dark:bg-muted px-2 py-[2.5px] rounded-full group-hover:bg-surface transition-colors truncate max-w-[140px]">
                          {item.sectionName}
                        </span>
                      ) : null}
                      <span className="text-[11.5px] text-[#9496ab] dark:text-foreground-subtle truncate">
                        {item.date}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-[#9496ab] dark:text-foreground-subtle group-hover:text-[#4b4396] dark:group-hover:text-brand transition-colors">
                    <CaretRight weight="bold" className="size-4" />
                  </div>
                </button>
              )
            })}
          </div>

          {showPagination && pagination && (
            <div className="flex shrink-0 items-center justify-center pt-3 pb-1 mt-1 border-t border-[#e9e9f3]/50 dark:border-border/50">
              <div className="flex items-center bg-[#f4f4f7] dark:bg-muted rounded-full p-1 shadow-sm border border-[#e9e9f3] dark:border-border">
                <button
                  type="button"
                  disabled={!pagination.hasPreviousPage || isPageLoading}
                  onClick={() => pagination.onPageChange(pagination.page - 1)}
                  className={cn(
                    'flex items-center justify-center size-[26px] rounded-full transition-all duration-200',
                    pagination.hasPreviousPage
                      ? 'text-[#15162c] dark:text-foreground hover:bg-surface hover:shadow-sm hover:scale-105 active:scale-95'
                      : 'text-[#c4c5d4] dark:text-foreground-subtle/60 cursor-not-allowed',
                  )}
                >
                  <CaretLeft
                    weight="bold"
                    className="size-3.5 -translate-x-[0.5px]"
                  />
                </button>
                <div className="px-3.5 flex items-center justify-center min-w-[50px] text-[11.5px] font-bold text-[#62647d] dark:text-foreground-muted">
                  <span className="text-[#15162c] dark:text-foreground">
                    {pagination.page}
                  </span>
                  <span className="text-[#c4c5d4] dark:text-foreground-subtle/60 mx-1.5">
                    /
                  </span>
                  <span>{pagination.totalPages}</span>
                </div>
                <button
                  type="button"
                  disabled={!pagination.hasNextPage || isPageLoading}
                  onClick={() => pagination.onPageChange(pagination.page + 1)}
                  className={cn(
                    'flex items-center justify-center size-[26px] rounded-full transition-all duration-200',
                    pagination.hasNextPage
                      ? 'text-[#15162c] dark:text-foreground hover:bg-surface hover:shadow-sm hover:scale-105 active:scale-95'
                      : 'text-[#c4c5d4] dark:text-foreground-subtle/60 cursor-not-allowed',
                  )}
                >
                  <CaretRight
                    weight="bold"
                    className="size-3.5 translate-x-[0.5px]"
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
