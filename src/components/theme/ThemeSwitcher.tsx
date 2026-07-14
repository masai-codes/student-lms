'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Check, Palette } from 'lucide-react'

import { useTheme } from '@/lib/theme'
import type { ThemeDefinition } from '@/lib/theme'
import { cn } from '@/lib/utils'

type ThemeSwitcherProps = {
  className?: string
}

function SwatchDots({ swatch }: { swatch: ThemeDefinition['swatch'] }) {
  return (
    <span
      className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-strong"
      style={{ backgroundColor: swatch[0] }}
      aria-hidden
    >
      <span className="grid grid-cols-2 gap-0.5">
        {swatch.map((color, i) => (
          <span
            key={i}
            className="size-2.5 rounded-full ring-1 ring-black/5"
            style={{ backgroundColor: color }}
          />
        ))}
      </span>
    </span>
  )
}

export function ThemeSwitcher({ className }: ThemeSwitcherProps) {
  const { theme, themes, setTheme, hydrated } = useTheme()

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Change theme"
          title="Change theme"
          className={cn(
            'inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-foreground-muted shadow-none outline-none transition-colors hover:text-brand focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 data-[state=open]:text-brand',
            className,
          )}
        >
          <Palette className="size-6" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={10}
          align="end"
          collisionPadding={12}
          className="z-[400] w-[300px] overflow-hidden rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg"
        >
          <div className="px-2 pb-2 pt-1">
            <p className="text-[13px] font-semibold text-foreground">Theme</p>
            <p className="text-[12px] text-foreground-muted">
              Pick a look. It’s saved to this device.
            </p>
          </div>

          <div className="flex flex-col gap-0.5">
            {themes.map((t) => {
              const isActive = hydrated && t.id === theme
              return (
                <DropdownMenu.Item
                  key={t.id}
                  onSelect={(e) => {
                    // Keep the menu logic simple; selecting applies immediately.
                    e.preventDefault()
                    setTheme(t.id)
                  }}
                  className={cn(
                    'group flex cursor-pointer select-none items-center gap-3 rounded-lg px-2 py-2 outline-none transition-colors',
                    'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground',
                    isActive && 'bg-brand-subtle',
                  )}
                >
                  <SwatchDots swatch={t.swatch} />

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'truncate text-[13.5px] font-medium text-foreground',
                          isActive && 'text-brand-subtle-foreground',
                        )}
                      >
                        {t.label}
                      </span>
                      {t.stability === 'preview' ? (
                        <span className="rounded-full bg-warning-subtle px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-warning-subtle-foreground">
                          Preview
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block truncate text-[11.5px] leading-tight text-foreground-muted">
                      {t.description}
                    </span>
                  </span>

                  <span className="flex size-5 shrink-0 items-center justify-center">
                    {isActive ? (
                      <Check className="size-4 text-brand" strokeWidth={3} />
                    ) : null}
                  </span>
                </DropdownMenu.Item>
              )
            })}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
