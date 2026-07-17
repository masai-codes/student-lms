interface SidebarPanelProps {
  title: string
  /** `data-testid` for the panel root; the title gets `${testId}-title`. */
  testId: string
  /** Optional trailing action rendered in the panel header (e.g. "View All"). */
  action?: React.ReactNode
  /** Query state — the header always shows; the body reflects loading/error/empty. */
  isLoading?: boolean
  isError?: boolean
  isEmpty?: boolean
  /** Body text when empty (e.g. "No announcements yet"). */
  emptyText?: string
  children: React.ReactNode
}

// Shared shell for sidebar panels: titled card with an optional header action
// and standard loading / error / empty states. The header (title + action) is
// shown in every state; only the body changes.
export function SidebarPanel({
  title,
  testId,
  action,
  isLoading = false,
  isError = false,
  isEmpty = false,
  emptyText = 'No content available',
  children,
}: SidebarPanelProps) {
  return (
    <section
      data-testid={testId}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 transition-colors duration-300 hover:border-[#4F6BED]/25"
    >
      <div className="flex items-center justify-between gap-2">
        <h3
          data-testid={`${testId}-title`}
          className="flex items-center gap-2 text-base font-bold text-foreground"
        >
          <span
            aria-hidden
            className="h-4 w-1 shrink-0 rounded-full bg-gradient-to-b from-[#4F6BED] to-[#7C3AED]"
          />
          {title}
        </h3>
        {action}
      </div>
      <PanelBody
        testId={testId}
        isLoading={isLoading}
        isError={isError}
        isEmpty={isEmpty}
        emptyText={emptyText}
      >
        {children}
      </PanelBody>
    </section>
  )
}

function PanelBody({
  testId,
  isLoading,
  isError,
  isEmpty,
  emptyText,
  children,
}: {
  testId: string
  isLoading: boolean
  isError: boolean
  isEmpty: boolean
  emptyText: string
  children: React.ReactNode
}) {
  if (isLoading) {
    return (
      <div data-testid={`${testId}-loading`} className="flex flex-col gap-3">
        {/* Tests (and screen readers) still see the literal "Loading…". */}
        <span className="sr-only">Loading…</span>
        {[0, 1].map((i) => (
          <div
            key={i}
            className="dash-skeleton h-14 rounded-xl"
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </div>
    )
  }
  if (isError) {
    return (
      <p
        data-testid={`${testId}-error`}
        className="py-8 text-center text-sm text-foreground-subtle"
      >
        Failed to load content
      </p>
    )
  }
  if (isEmpty) {
    return (
      <p
        data-testid={`${testId}-empty`}
        className="py-8 text-center text-sm text-foreground-subtle"
      >
        {emptyText}
      </p>
    )
  }
  return <>{children}</>
}

export function SidebarPanelLink({
  label,
  testId,
  onClick,
}: {
  label: string
  testId: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className="group inline-flex items-center gap-0.5 text-sm font-medium text-[#4F46E5] transition-colors hover:text-[#4338CA] focus-visible:outline-none focus-visible:underline"
    >
      <span>{label}</span>
      <span
        aria-hidden
        className="transition-transform duration-200 ease-out group-hover:translate-x-0.5"
      >
        →
      </span>
    </button>
  )
}
