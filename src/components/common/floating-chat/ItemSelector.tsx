import { cn } from '@/lib/utils'
import { MagnifyingGlass, CaretRight, CaretLeft } from '@phosphor-icons/react'
import type { Category, Item } from './types'
import { formatSupportLectureTypeLabel, supportLectureTypeChipClassName } from './supportCategoryLearning'

interface ItemSelectorPagination {
  page: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
  onPageChange: (page: number) => void
}

interface ItemSelectorProps {
  categoryObj: Category
  items: Item[]
  search: string
  onSearchChange: (value: string) => void
  onSelect: (item: Item) => void
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  pagination?: ItemSelectorPagination
}

export function ItemSelector({
  categoryObj,
  items,
  search,
  onSearchChange,
  onSelect,
  isLoading = false,
  isError = false,
  onRetry,
  pagination,
}: ItemSelectorProps) {
  const showPagination =
    pagination != null && (pagination.hasPreviousPage || pagination.hasNextPage)

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center gap-2 bg-[#f1f1f7] rounded-[10px] p-[10px_12px] shrink-0 mb-1">
        <MagnifyingGlass weight="bold" className="size-4 text-[#9496ab] shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={`Search ${categoryObj.label.toLowerCase()}s...`}
          className="flex-1 bg-transparent outline-none border-none text-[13.6px] text-[#15162c] placeholder:text-[#9496ab] font-[inherit]"
        />
      </div>

      {isLoading && (
        <div className="flex flex-1 items-center justify-center py-8">
          <p className="text-[13px] text-[#62647d]">Loading {categoryObj.label.toLowerCase()}s…</p>
        </div>
      )}

      {isError && !isLoading && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
          <p className="text-[13px] text-[#62647d]">
            Couldn&apos;t load {categoryObj.label.toLowerCase()}s.
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-[10px] border border-[#e9e9f3] bg-white px-4 py-2 text-[13px] font-bold text-[#15162c] hover:bg-[#f0f0fd]"
            >
              Try again
            </button>
          )}
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
          <p className="text-[14px] font-bold text-[#15162c]">No {categoryObj.label.toLowerCase()}s found</p>
          <p className="text-[12.5px] text-[#62647d]">
            {search.trim() ? 'Try a different search term.' : 'Nothing is available for this batch yet.'}
          </p>
        </div>
      )}

      {!isLoading && !isError && items.length > 0 && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex flex-col flex-1 overflow-y-auto">
            {items.map((item) => {
              const lectureTypeLabel =
                categoryObj.id === 'lecture'
                  ? formatSupportLectureTypeLabel(item.type)
                  : null
              const showOptional =
                (categoryObj.id === 'assignment' ||
                  categoryObj.id === 'evaluation' ||
                  categoryObj.id === 'resource') &&
                item.isOptional === true

              return (
              <button
                key={item.id ?? item.title}
                type="button"
                onClick={() => onSelect(item)}
                className="flex w-full items-center gap-3 p-[11px_10px] rounded-[10px] cursor-pointer transition-colors hover:bg-[#f0f0fd] mb-[3px] group text-left"
              >
                <div className="flex items-center justify-center shrink-0 size-[34px] rounded-[9px] bg-[#f1f1f7] text-[#62647d] group-hover:bg-[#e3e3fb] group-hover:text-[#4b4396] transition-colors">
                  <categoryObj.icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <strong className="block text-[13.6px] font-semibold text-[#15162c] truncate">
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
                    {showOptional ? (
                      <span className="text-[11px] font-bold text-[#b54708] bg-[#fffaeb] px-2 py-[2.5px] rounded-full shrink-0">
                        Optional
                      </span>
                    ) : null}
                    <span className="text-[11px] font-bold text-[#62647d] bg-[#f1f1f7] px-2 py-[2.5px] rounded-full group-hover:bg-white transition-colors truncate max-w-[140px]">
                      {item.meta}
                    </span>
                    <span className="text-[11.5px] text-[#9496ab] truncate">{item.date}</span>
                  </div>
                </div>
                <div className="shrink-0 text-[#9496ab] group-hover:text-[#4b4396] transition-colors">
                  <CaretRight weight="bold" className="size-4" />
                </div>
              </button>
              )
            })}
          </div>

          {showPagination && pagination && (
            <div className="flex shrink-0 items-center justify-center pt-3 pb-1 mt-1 border-t border-[#e9e9f3]/50">
              <div className="flex items-center bg-[#f4f4f7] rounded-full p-1 shadow-sm border border-[#e9e9f3]">
                <button
                  type="button"
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => pagination.onPageChange(pagination.page - 1)}
                  className={cn(
                    'flex items-center justify-center size-[26px] rounded-full transition-all duration-200',
                    pagination.hasPreviousPage
                      ? 'text-[#15162c] hover:bg-white hover:shadow-sm hover:scale-105 active:scale-95'
                      : 'text-[#c4c5d4] cursor-not-allowed',
                  )}
                >
                  <CaretLeft weight="bold" className="size-3.5 -translate-x-[0.5px]" />
                </button>
                <div className="px-3.5 flex items-center justify-center min-w-[50px] text-[11.5px] font-bold text-[#62647d]">
                  <span className="text-[#15162c]">{pagination.page}</span>
                  <span className="text-[#c4c5d4] mx-1.5">/</span>
                  <span>{pagination.totalPages}</span>
                </div>
                <button
                  type="button"
                  disabled={!pagination.hasNextPage}
                  onClick={() => pagination.onPageChange(pagination.page + 1)}
                  className={cn(
                    'flex items-center justify-center size-[26px] rounded-full transition-all duration-200',
                    pagination.hasNextPage
                      ? 'text-[#15162c] hover:bg-white hover:shadow-sm hover:scale-105 active:scale-95'
                      : 'text-[#c4c5d4] cursor-not-allowed',
                  )}
                >
                  <CaretRight weight="bold" className="size-3.5 translate-x-[0.5px]" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
