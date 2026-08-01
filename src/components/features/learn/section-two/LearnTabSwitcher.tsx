import { CommonIcon } from '@/components/common/Icon'
import { pushLearnEvent } from '../shared/learnAnalytics'
import type { LearnTab } from '../shared/types'

const LEARN_TAB_ITEMS: ReadonlyArray<{
  value: LearnTab
  label: string
  icon: 'lecture' | 'assignment' | 'resource'
}> = [
  { value: 'lectures', label: 'Lectures', icon: 'lecture' },
  { value: 'assignments', label: 'Assignments', icon: 'assignment' },
  { value: 'resources', label: 'Resources', icon: 'resource' },
]

/** Matches `TEXT_CLASSES` in `navbar-trailing-actions.tsx` — same plain-text
 * tab look as Discussions/Bookmarks, so all five Tier 2 items read as one
 * consistent set. */
const TIER2_TAB_CLASSES =
  'cursor-pointer whitespace-nowrap rounded-md px-2 py-1.5 font-poppins text-[12px] md:text-[13px] font-medium shadow-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0'

interface LearnTabSwitcherProps {
  activeTab: LearnTab | undefined
  onTabChange: (tab: LearnTab) => void
  className?: string
  /**
   * `default` (mobile, inline on the page) and `tier2` (portaled into the
   * desktop navbar) both render the same plain-text underline style shared
   * by Discussions/Bookmarks — only spacing differs between the two.
   */
  variant?: 'default' | 'tier2'
}

/**
 * Lectures/Assignments/Resources tab switcher. Rendered twice by
 * `LearnControlsSection` — inline on mobile, portaled into the desktop
 * navbar's Tier 2 row on `lg`+ — so it's a standalone component rather than
 * inline JSX.
 */
export function LearnTabSwitcher({
  activeTab,
  onTabChange,
  className,
  variant = 'default',
}: LearnTabSwitcherProps) {
  const handleChange = (tab: LearnTab) => {
    pushLearnEvent('l_learn_tab_change', { tab })
    onTabChange(tab)
  }

  const containerClasses =
    variant === 'tier2'
      ? `flex flex-wrap items-stretch gap-0 ${className ?? ''}`.trim()
      : `flex flex-wrap items-stretch gap-4 ${className ?? ''}`.trim()

  return (
    <div
      role="tablist"
      aria-label="Learning content type"
      className={containerClasses}
    >
      {LEARN_TAB_ITEMS.map((tab) => {
        const isActive = activeTab === tab.value
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => handleChange(tab.value)}
            className={`pl-2 pr-3 md:pl-4 md:pr-6 relative inline-flex items-center ${TIER2_TAB_CLASSES} ${
              isActive ? 'text-brand' : 'text-foreground-muted hover:text-brand'
            }`}
          >
            <CommonIcon name={tab.icon} className="size-4 mr-2" />
            {tab.label}
            {/* Matches the Tier 1 active-tab underline (navbar-nav-items.tsx)
                so both rows read as the same tab pattern. */}
            <span
              aria-hidden="true"
              className={`absolute inset-x-2 bottom-0 h-0.5 rounded-t-[2px] transition-colors ${
                isActive ? 'bg-brand' : 'bg-transparent'
              }`}
            />
          </button>
        )
      })}
    </div>
  )
}
