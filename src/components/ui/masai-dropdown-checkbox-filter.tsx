'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'

import { Check, ChevronDown } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

/** One selectable row inside the dropdown. */
export type MasaiDropdownCheckboxFilterOption = {
  value: string
  label: string
  disabled?: boolean
}

export type MasaiDropdownCheckboxFilterProps = {
  options: Array<MasaiDropdownCheckboxFilterOption>
  /** Controlled selection — pass from parent state. */
  value: Array<string>
  /** Called when the user toggles any option (full next array). */
  onValueChange: (values: Array<string>) => void
  /** Short prefix shown on the trigger, e.g. `Module`. */
  triggerLabel?: string
  /** Heading shown at the top of the open menu, e.g. `Select modules`. */
  menuLabel?: string
  disabled?: boolean
  /** Root wrapper classes (layout, width). */
  className?: string
  triggerClassName?: string
  contentAlign?: 'start' | 'center' | 'end'
  sideOffset?: number
  /** `plain` drops the rounded blue chevron badge in favour of a bare icon. */
  chevronVariant?: 'badge' | 'plain'
}

function toggleSelected(
  values: Array<string>,
  optionValue: string,
): Array<string> {
  return values.includes(optionValue)
    ? values.filter((v) => v !== optionValue)
    : [...values, optionValue]
}

/**
 * MasaiDropdownCheckboxFilter — multi-select styled to match the `/learn` batch
 * picker: a rounded-full chevron badge trigger (with a selection count), a soft
 * card panel, and staggered rows that highlight the chosen options in the brand
 * colour. Toggling keeps the menu open.
 */
export function MasaiDropdownCheckboxFilter({
  options,
  value,
  onValueChange,
  triggerLabel = 'Filter',
  menuLabel,
  disabled = false,
  className,
  triggerClassName,
  contentAlign = 'start',
  sideOffset = 8,
  chevronVariant = 'badge',
}: MasaiDropdownCheckboxFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={cn('inline-flex', className)}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <button
            type="button"
            className={cn(
              'group flex min-h-[44px] min-w-[150px] max-w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-2 text-left transition-all duration-200',
              'hover:-translate-y-px hover:border-brand/35 hover:bg-surface-muted',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 data-[state=open]:border-brand/40',
              triggerClassName,
            )}
          >
            <span className="type-b2-md min-w-0 flex-1 truncate text-foreground">
              {triggerLabel}
            </span>
            <span className="inline-flex shrink-0 items-center gap-2">
              {value.length > 0 ? (
                <span
                  className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand/10 px-1.5 type-caption font-semibold text-brand"
                  aria-hidden
                >
                  {value.length}
                </span>
              ) : null}
              <span
                className={cn(
                  'flex shrink-0 items-center justify-center transition-colors',
                  chevronVariant === 'badge'
                    ? 'rounded-full bg-blue-50 p-1.5 text-blue-500 group-hover:bg-blue-100 dark:bg-info-subtle dark:text-info-subtle-foreground dark:group-hover:bg-info-subtle'
                    : 'text-foreground-muted',
                )}
                aria-hidden
              >
                <ChevronDown
                  className={cn(
                    'size-4 transition-transform duration-200',
                    isOpen ? 'rotate-180' : '',
                  )}
                />
              </span>
            </span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align={contentAlign}
          sideOffset={sideOffset}
          className="max-h-[min(60vh,420px)] w-[min(92vw,320px)] min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto rounded-xl border border-border bg-surface p-2 shadow-lg"
        >
          {menuLabel ? (
            <DropdownMenuLabel className="text-foreground-muted">
              {menuLabel}
            </DropdownMenuLabel>
          ) : null}
          {options.map((option, index) => {
            const isChecked = value.includes(option.value)
            return (
              <DropdownMenuItem
                key={option.value}
                disabled={option.disabled}
                // Keep the menu open so several options can be toggled in one pass.
                onSelect={(event) => {
                  event.preventDefault()
                  onValueChange(toggleSelected(value, option.value))
                }}
                style={{ '--dash-delay': `${index * 0.04}s` } as CSSProperties}
                className={cn(
                  'animate-dash-row-in cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-brand/5 focus:bg-brand/5',
                  isChecked ? 'bg-brand/5' : '',
                )}
              >
                <span
                  className={cn(
                    'type-b2-md min-w-0 flex-1 truncate',
                    isChecked ? 'font-semibold text-brand' : 'text-foreground',
                  )}
                >
                  {option.label}
                </span>
                {isChecked ? (
                  <Check
                    className="size-4 shrink-0 text-brand"
                    strokeWidth={2}
                    aria-hidden
                  />
                ) : null}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
