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
export type MasaiSelectDropdownOption = {
  value: string
  label: string
  disabled?: boolean
}

export type MasaiSelectDropdownProps = {
  options: ReadonlyArray<MasaiSelectDropdownOption>
  /** Controlled selection — the currently selected option value. */
  value: string
  onValueChange: (value: string) => void
  /** Short prefix shown before the selected label, e.g. `Section`. */
  triggerLabel?: string
  /** Heading shown at the top of the open menu, e.g. `Select a section`. */
  menuLabel?: string
  disabled?: boolean
  className?: string
  triggerClassName?: string
  contentAlign?: 'start' | 'center' | 'end'
  sideOffset?: number
  ['aria-label']?: string
}

/**
 * MasaiSelectDropdown — single-select styled to match the `/learn` batch picker:
 * an anchored menu with a rounded-full chevron badge trigger, a soft card panel,
 * and staggered rows that highlight the active option in the brand colour.
 */
export function MasaiSelectDropdown({
  options,
  value,
  onValueChange,
  triggerLabel,
  menuLabel,
  disabled = false,
  className,
  triggerClassName,
  contentAlign = 'start',
  sideOffset = 8,
  ['aria-label']: ariaLabel,
}: MasaiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selected = options.find((option) => option.value === value)
  const selectedLabel = selected?.label ?? options[0]?.label ?? ''

  return (
    <div className={cn('inline-flex', className)}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <button
            type="button"
            aria-label={ariaLabel ?? triggerLabel}
            className={cn(
              'group flex min-h-[44px] min-w-[150px] max-w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-2 text-left transition-all duration-200',
              'hover:-translate-y-px hover:border-brand/35 hover:bg-surface-muted',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 data-[state=open]:border-brand/40',
              triggerClassName,
            )}
          >
            <span className="min-w-0 flex-1 truncate">
              {triggerLabel ? (
                <span className="type-caption text-foreground-muted">
                  {triggerLabel}:{' '}
                </span>
              ) : null}
              <span className="type-b2-md text-foreground">
                {selectedLabel}
              </span>
            </span>
            <span
              className="flex shrink-0 items-center justify-center rounded-full bg-blue-50 p-1.5 text-blue-500 transition-colors group-hover:bg-blue-100 dark:bg-info-subtle dark:text-info-subtle-foreground dark:group-hover:bg-info-subtle"
              aria-hidden
            >
              <ChevronDown
                className={cn(
                  'size-4 transition-transform duration-200',
                  isOpen ? 'rotate-180' : '',
                )}
              />
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
            const isSelected = option.value === value
            return (
              <DropdownMenuItem
                key={option.value}
                disabled={option.disabled}
                onSelect={() => onValueChange(option.value)}
                style={{ '--dash-delay': `${index * 0.04}s` } as CSSProperties}
                className={cn(
                  'animate-dash-row-in cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-brand/5 focus:bg-brand/5',
                  isSelected ? 'bg-brand/5' : '',
                )}
              >
                <span
                  className={cn(
                    'type-b2-md min-w-0 flex-1 truncate',
                    isSelected ? 'font-semibold text-brand' : 'text-foreground',
                  )}
                >
                  {option.label}
                </span>
                {isSelected ? (
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
