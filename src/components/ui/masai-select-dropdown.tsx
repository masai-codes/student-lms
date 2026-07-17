'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Check, ChevronDown } from 'lucide-react'

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
  disabled?: boolean
  className?: string
  triggerClassName?: string
  contentAlign?: 'start' | 'center' | 'end'
  sideOffset?: number
  ['aria-label']?: string
}

const contentClassName =
  'z-[220] max-h-[min(320px,var(--radix-dropdown-menu-content-available-height))] min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto rounded-lg border border-border bg-surface p-1 text-foreground shadow-md'

const itemClassName = cn(
  'relative flex cursor-pointer select-none items-center rounded-[2px] py-2 pl-9 pr-3 type-b2-regular text-foreground outline-none transition-colors',
  'data-highlighted:bg-surface-muted',
  'data-disabled:pointer-events-none data-disabled:opacity-50',
)

/**
 * MasaiSelectDropdown — Radix DropdownMenu single-select, styled to match
 * `MasaiDropdownCheckboxFilter`. Selection is controlled by the parent.
 */
export function MasaiSelectDropdown({
  options,
  value,
  onValueChange,
  triggerLabel,
  disabled = false,
  className,
  triggerClassName,
  contentAlign = 'start',
  sideOffset = 6,
  ['aria-label']: ariaLabel,
}: MasaiSelectDropdownProps) {
  const selected = options.find((option) => option.value === value)
  const selectedLabel = selected?.label ?? options[0]?.label ?? ''

  return (
    <div className={cn('inline-flex', className)}>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild disabled={disabled}>
          <button
            type="button"
            aria-label={ariaLabel ?? triggerLabel}
            className={cn(
              'inline-flex min-h-[44px] min-w-[140px] max-w-full shrink-0 items-center justify-between gap-2 rounded-[8px] border border-border bg-surface px-[12px] py-[10px] type-b2-md text-foreground outline-none transition-colors',
              'hover:border-border-strong hover:bg-surface-muted',
              'focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              'data-disabled:pointer-events-none data-disabled:opacity-50 data-[state=open]:border-primary-500 data-[state=open]:ring-2 data-[state=open]:ring-primary-400 data-[state=open]:ring-offset-2 data-[state=open]:ring-offset-background',
              triggerClassName,
            )}
          >
            <span className="min-w-0 flex-1 truncate text-left">
              {triggerLabel ? (
                <span className="text-foreground-muted">{triggerLabel}: </span>
              ) : null}
              {selectedLabel}
            </span>
            <ChevronDown
              className="size-4 shrink-0 text-foreground-muted"
              aria-hidden
            />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className={contentClassName}
            align={contentAlign}
            sideOffset={sideOffset}
            collisionPadding={12}
          >
            <DropdownMenu.Group>
              {options.map((option) => {
                const isSelected = option.value === value
                return (
                  <DropdownMenu.Item
                    key={option.value}
                    className={itemClassName}
                    disabled={option.disabled}
                    onSelect={() => onValueChange(option.value)}
                  >
                    {isSelected ? (
                      <Check
                        className="pointer-events-none absolute left-2.5 size-4 text-primary-500"
                        aria-hidden
                      />
                    ) : null}
                    <span className="min-w-0 flex-1 truncate">
                      {option.label}
                    </span>
                  </DropdownMenu.Item>
                )
              })}
            </DropdownMenu.Group>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}
