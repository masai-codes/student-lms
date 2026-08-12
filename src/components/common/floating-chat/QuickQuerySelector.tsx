import { CaretRight, Question } from '@phosphor-icons/react'

export interface QuickQueryOption {
  value: string
  label: string
}

interface QuickQuerySelectorProps {
  queries: QuickQueryOption[]
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  onSelect: (option: QuickQueryOption) => void
}

export function QuickQuerySelector({
  queries,
  isLoading = false,
  isError = false,
  onRetry,
  onSelect,
}: QuickQuerySelectorProps) {
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-8">
        <p className="text-[13px] text-[#62647d] dark:text-foreground-muted">
          Loading common questions…
        </p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
        <p className="text-[13px] text-[#62647d] dark:text-foreground-muted">
          Couldn&apos;t load common questions.
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-[10px] border border-[#e9e9f3] dark:border-border bg-surface px-4 py-2 text-[13px] font-bold text-[#15162c] dark:text-foreground hover:bg-[#f0f0fd] dark:hover:bg-accent"
          >
            Try again
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-right-2 duration-300">
      <div className="flex flex-col gap-[9px]">
        {queries.map((query) => (
          <button
            key={query.value}
            type="button"
            onClick={() => onSelect(query)}
            className="group flex shrink-0 items-center gap-[13px] p-[13px_12px] bg-surface border border-[#e9e9f3] dark:border-border rounded-[14px] text-left hover:bg-[rgba(75,67,150,0.03)] dark:hover:bg-brand/10 hover:border-[#4b4396]/30 dark:hover:border-brand/40 hover:translate-x-0.5 transition-all duration-150 ease-out"
          >
            <div className="flex items-center justify-center shrink-0 size-[38px] rounded-[11px] bg-[rgba(75,67,150,0.06)] dark:bg-brand/15 text-[#4b4396] dark:text-brand">
              <Question weight="fill" className="size-[19px]" />
            </div>
            <span className="flex-1 block text-[12.5px] font-semibold text-[#15162c] dark:text-foreground leading-snug">
              {query.label}
            </span>
            <div className="shrink-0 text-[#9496ab] dark:text-foreground-subtle group-hover:text-[#4b4396] dark:group-hover:text-brand transition-colors">
              <CaretRight weight="bold" className="size-4" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
