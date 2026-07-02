interface SidebarPanelProps {
  title: string
  /** `data-testid` for the panel root; the title gets `${testId}-title`. */
  testId: string
  /** Optional trailing action rendered in the panel header (e.g. "View all"). */
  action?: React.ReactNode
  children: React.ReactNode
}

// Shared shell for sidebar panels: titled card with an optional header action.
export function SidebarPanel({ title, testId, action, children }: SidebarPanelProps) {
  return (
    <section
      data-testid={testId}
      className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 data-testid={`${testId}-title`} className="text-base font-bold text-gray-900">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  )
}

export function SidebarPanelLink({
  label,
  testId,
}: {
  label: string
  testId: string
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      className="text-sm font-medium text-[#4F46E5] transition-colors hover:text-[#4338CA] focus-visible:outline-none focus-visible:underline"
    >
      {label}
    </button>
  )
}
