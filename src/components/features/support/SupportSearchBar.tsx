import { MagnifyingGlass, X } from '@phosphor-icons/react'

import { cn } from '@/lib/utils'

/**
 * SupportSearchBar — the hero of the Help home and the primary deflection lever.
 *
 * A large, friendly search field. It's a controlled input; the parent owns the
 * value and debounces the actual FAQ query. Shows a clear (✕) affordance when
 * there's text, and an optional live result count.
 */
export function SupportSearchBar({
  value,
  onChange,
  resultCount,
  autoFocus,
  placeholder = 'Search help — “score”, “leave”, “certificate”…',
}: {
  value: string
  onChange: (value: string) => void
  resultCount?: number
  autoFocus?: boolean
  placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          'flex items-center gap-3 rounded-2xl border border-border bg-card px-4',
          'shadow-sm transition-shadow focus-within:shadow-md focus-within:ring-2 focus-within:ring-primary/30',
        )}
      >
        <MagnifyingGlass className="size-5 shrink-0 text-muted-foreground" />
        <input
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label="Search help articles"
          className="h-12 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      {value.trim() !== '' && typeof resultCount === 'number' && (
        <p className="px-1 text-xs text-muted-foreground">
          {resultCount} {resultCount === 1 ? 'result' : 'results'} for “{value.trim()}”
        </p>
      )}
    </div>
  )
}
