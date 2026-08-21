import type { ReactNode } from 'react'

/**
 * Shared friendly empty state. The old profile page rendered nothing at all when
 * a tab had no data (a literally blank panel on Acknowledgements, `null` on
 * Achievements and Certificates), which read as a broken page.
 */
export function ProfileEmptyState({
  icon,
  title,
  description,
  testId,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  testId: string
  action?: ReactNode
}) {
  return (
    <div
      data-testid={testId}
      className="flex flex-col items-center justify-center gap-4 py-16 text-center"
    >
      <span className="animate-dash-float text-foreground-subtle" aria-hidden>
        {icon}
      </span>
      <div className="max-w-sm">
        <p className="type-b1-md text-foreground">{title}</p>
        <p className="mt-1 type-b2-regular text-foreground-subtle">
          {description}
        </p>
      </div>
      {action}
    </div>
  )
}

/**
 * Card-shaped shimmer rows mirroring the real layout, using the shared
 * `dash-skeleton` kit rather than a spinner.
 */
export function ProfileCardListSkeleton({
  rows = 3,
  testId,
}: {
  rows?: number
  testId: string
}) {
  return (
    <div data-testid={testId} className="flex flex-col gap-3">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4"
        >
          <div className="dash-skeleton size-10 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="dash-skeleton h-4 w-[45%] rounded" />
            <div className="dash-skeleton h-3 w-[30%] rounded" />
          </div>
          <div className="dash-skeleton h-9 w-20 shrink-0 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

/** Consistent shell for every tab panel: themed surface, entrance animation. */
export function ProfileTabPanel({
  testId,
  children,
  className = '',
}: {
  testId: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      data-testid={testId}
      className={`animate-dash-rise rounded-2xl border border-border bg-surface p-4 md:p-6 ${className}`}
    >
      {children}
    </section>
  )
}

/** Inline failure notice — a tab that can't load says so instead of looking empty. */
export function ProfileErrorState({
  testId,
  message,
}: {
  testId: string
  message: string
}) {
  return (
    <p
      data-testid={testId}
      role="alert"
      className="rounded-xl border border-danger bg-danger-subtle px-4 py-3 type-b2-regular text-danger-subtle-foreground"
    >
      {message}
    </p>
  )
}
