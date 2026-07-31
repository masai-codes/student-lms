'use client'

import type { ReactNode } from 'react'
import { NavbarAnchor } from './navbar-anchor'
import type { NavbarActionItem } from './types'

import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

/** Wraps an icon-only trigger with the shared Radix tooltip when one is given. */
function WithTooltip({
  tooltip,
  children,
}: {
  tooltip?: string
  children: ReactNode
}) {
  if (!tooltip) return <>{children}</>
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}

type NavbarTrailingActionsProps = {
  items: Array<NavbarActionItem>
  className?: string
}

/** Stable automation hook per action, derived from the item's own id. */
function actionTestId(item: NavbarActionItem, index: number) {
  const slug = item.id ?? `${item.type}-${index}`
  return item.type === 'icon' || item.type === 'iconText'
    ? `navbar-icon-action-${slug}`
    : `navbar-action-${slug}`
}

/**
 * Compact 32px pill/circle hit targets shared by every action variant — matches
 * the navbar's small-control scale while staying a comfortable tap target.
 */
const ICON_BUTTON_CLASSES =
  'relative inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-foreground-muted shadow-none transition-colors hover:bg-surface-muted hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 [&_svg]:size-[17px]'

const TEXT_CLASSES =
  'cursor-pointer whitespace-nowrap font-poppins text-[13px] font-medium text-foreground-muted shadow-none transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0'

export function NavbarTrailingActions({
  items,
  className,
}: NavbarTrailingActionsProps) {
  if (!items.length) {
    return null
  }

  return (
    <div className={cn('flex shrink-0 items-center gap-1', className)}>
      {items.map((item, index) => {
        const testId = actionTestId(item, index)

        if (item.type === 'divider') {
          return (
            <span
              key={item.id ?? `divider-${index}`}
              aria-hidden="true"
              data-testid={testId}
              className="mx-1 h-5 w-px shrink-0 bg-border"
            />
          )
        }

        const key = item.id ?? `${item.type}-${item.href}-${index}`

        if (item.type === 'text') {
          const isPill = item.variant === 'pill'

          return (
            <NavbarAnchor
              key={key}
              href={item.href}
              openInNewTab={item.openInNewTab}
              onClick={item.onClick}
              aria-current={item.isActive ? 'page' : undefined}
              data-testid={testId}
              className={cn(
                TEXT_CLASSES,
                isPill
                  ? 'inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface px-3 hover:bg-surface-muted'
                  : 'relative inline-flex self-stretch items-center gap-1.5 rounded-md px-2 py-1.5',
                item.isActive && 'text-brand font-semibold hover:text-brand',
              )}
            >
              {item.icon ? (
                <span
                  className="flex shrink-0 items-center justify-center [&_svg]:size-4"
                  aria-hidden
                >
                  {item.icon}
                </span>
              ) : null}
              <span>{item.label}</span>
              {/* Matches the Tier 1/Tier 2 tab underline (navbar-nav-items.tsx,
                  LearnTabSwitcher) so every tab-style nav item is consistent. */}
              {!isPill ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute inset-x-2 bottom-0 h-0.5 rounded-t-[2px] transition-colors',
                    item.isActive ? 'bg-brand' : 'bg-transparent',
                  )}
                />
              ) : null}
            </NavbarAnchor>
          )
        }

        if (item.type === 'iconText') {
          return (
            <NavbarAnchor
              key={key}
              href={item.href}
              openInNewTab={item.openInNewTab}
              onClick={item.onClick}
              title={item.tooltip}
              aria-current={item.isActive ? 'page' : undefined}
              data-testid={testId}
              className={cn(
                TEXT_CLASSES,
                'inline-flex h-8 items-center gap-1.5 rounded-full px-2 hover:bg-surface-muted [&_svg]:size-[17px]',
                item.isActive && 'text-brand font-semibold hover:text-brand',
              )}
            >
              <span
                className="flex shrink-0 items-center justify-center"
                aria-hidden
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavbarAnchor>
          )
        }

        if (item.type === 'image') {
          const imageClassName = item.imageClassName?.trim().length
            ? item.imageClassName
            : 'h-6 w-auto object-contain'

          return (
            <WithTooltip key={key} tooltip={item.tooltip}>
              <NavbarAnchor
                href={item.href}
                openInNewTab={item.openInNewTab}
                onClick={item.onClick}
                data-testid={testId}
                className="inline-flex h-8 cursor-pointer items-center justify-center rounded-full px-1 text-foreground-muted shadow-none transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  className={imageClassName}
                  loading="lazy"
                  decoding="async"
                  suppressHydrationWarning
                />
              </NavbarAnchor>
            </WithTooltip>
          )
        }

        const count =
          typeof item.notificationCount === 'number' &&
          item.notificationCount > 0
            ? item.notificationCount
            : 0
        const badge =
          count > 0 ? (
            <span
              data-testid={`${testId}-badge`}
              className="pointer-events-none absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 font-poppins text-[10px] leading-4 font-semibold text-danger-foreground"
            >
              {count > 9 ? '9+' : count}
            </span>
          ) : null

        return (
          <WithTooltip key={key} tooltip={item.tooltip}>
            <NavbarAnchor
              href={item.href}
              openInNewTab={item.openInNewTab}
              onClick={item.onClick}
              aria-label={item.ariaLabel}
              aria-current={item.isActive ? 'page' : undefined}
              data-testid={testId}
              className={cn(
                ICON_BUTTON_CLASSES,
                item.isActive && 'bg-surface-muted text-brand',
              )}
            >
              {item.icon}
              {badge}
            </NavbarAnchor>
          </WithTooltip>
        )
      })}
    </div>
  )
}
