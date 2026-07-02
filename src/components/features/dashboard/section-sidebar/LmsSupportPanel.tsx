import { Question } from '@phosphor-icons/react'

// Compact call-to-action card inviting students to join the daily LMS support
// session. Static content for now.
export function LmsSupportPanel() {
  return (
    <button
      type="button"
      data-testid="dashboard-lms-support-panel"
      className="flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6962AC]"
    >
      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#6962AC]/10 text-[#6962AC]">
        <Question size={26} weight="fill" />
      </div>
      <div className="min-w-0">
        <h4 className="text-sm font-bold text-gray-900">LMS Support Session</h4>
        <p className="mt-0.5 truncate text-xs text-gray-600">
          Join our daily session to get help
        </p>
      </div>
    </button>
  )
}
