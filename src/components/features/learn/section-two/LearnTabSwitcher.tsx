import { MasaiTab } from '@/components/ui/masai-tab'
import { pushLearnEvent } from '../shared/learnAnalytics'
import type { LearnTab } from '../shared/types'

const LEARN_TAB_ICON_URL =
  'https://s3.ap-south-1.amazonaws.com/static.masaischool.com/tab-icon.svg'

const LEARN_TAB_ITEMS: ReadonlyArray<{ value: LearnTab; label: string }> = [
  { value: 'lectures', label: 'Lectures' },
  { value: 'assignments', label: 'Assignments' },
  { value: 'resources', label: 'Resources' },
]

/** Matches `TEXT_CLASSES` in `navbar-trailing-actions.tsx` — same plain-text
 * tab look as Discussions/Bookmarks, so all five Tier 2 items read as one
 * consistent set. */
const TIER2_TAB_CLASSES =
  'cursor-pointer whitespace-nowrap rounded-md px-2 py-1.5 font-poppins text-[13px] font-medium shadow-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0'

interface LearnTabSwitcherProps {
  activeTab: LearnTab
  onTabChange: (tab: LearnTab) => void
  className?: string
  /**
   * `default` (mobile, inline on the page — no Tier 2 nav there yet) keeps the
   * icon + underline `MasaiTab` look. `tier2` (portaled into the desktop
   * navbar) drops the icon and matches the plain-text style shared by
   * Discussions/Bookmarks, highlighting the active tab the same way.
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

  if (variant === 'tier2') {
    return (
      <div
        role="tablist"
        aria-label="Learning content type"
        className={`flex flex-wrap items-stretch gap-1 ${className ?? ''}`.trim()}
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
              className={`relative inline-flex items-center ${TIER2_TAB_CLASSES} ${
                isActive
                  ? 'text-brand font-semibold'
                  : 'text-foreground-muted hover:text-brand'
              }`}
            >
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

  return (
    <div
      role="tablist"
      aria-label="Learning content type"
      className={`flex flex-wrap items-center gap-4 ${className ?? ''}`.trim()}
    >
      {LEARN_TAB_ITEMS.map((tab) => (
        <MasaiTab
          key={tab.value}
          label={tab.label}
          selected={activeTab === tab.value}
          onClick={() => handleChange(tab.value)}
          iconLeft={
            <img
              src={LEARN_TAB_ICON_URL}
              alt=""
              width={24}
              height={24}
              className="size-6 shrink-0 object-contain"
            />
          }
        />
      ))}
    </div>
  )
}
