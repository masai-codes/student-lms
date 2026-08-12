'use client'

type MasaiTabItem = {
  value: string
  label: string
}

type MasaiTabsProps = {
  items: MasaiTabItem[]
  value: string
  onValueChange: (value: string) => void
  ariaLabel?: string
  className?: string
}

export function MasaiTabs({
  items,
  value,
  onValueChange,
  ariaLabel = 'Tabs',
  className = '',
}: MasaiTabsProps) {
  return (
    <div
      className={`inline-flex items-start gap-2 rounded-[48px] bg-surface-muted p-1 ${className}`.trim()}
      role="tablist"
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const isSelected = item.value === value

        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onValueChange(item.value)}
            className={`cursor-pointer rounded-[40px] px-4 py-2 text-[14px] font-medium leading-5 transition-colors ${
              isSelected
                ? 'bg-surface text-[#EF8833] dark:text-accent-warm'
                : 'bg-transparent text-foreground-muted hover:text-foreground-muted'
            }`}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
