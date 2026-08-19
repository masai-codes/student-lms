import { MasaiTab } from '@/components/ui/masai-tab'
import { pushProfileEvent } from '@/components/features/profile/shared/profileAnalytics'
import type {
  ProfileTab,
  ResolvedProfileTab,
} from '@/components/features/profile/profileTabsConfig'

/**
 * The tab strip. On small screens it is a scroll-snapping horizontal rail with
 * an edge fade so it is obvious there is more to the right — the old page relied
 * on bare `overflow-x-scroll` with no affordance at all.
 */
export function ProfileTabs({
  tabs,
  activeTab,
  onSelect,
}: {
  tabs: Array<ResolvedProfileTab>
  activeTab: ProfileTab
  onSelect: (tab: ProfileTab) => void
}) {
  return (
    <div className="relative">
      <div
        role="tablist"
        aria-label="Profile sections"
        data-testid="profile-tablist"
        className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 pr-6 md:flex-wrap md:overflow-visible md:pr-0"
      >
        {tabs.map((tab, index) => (
          <MasaiTab
            key={tab.id}
            label={tab.label}
            selected={tab.id === activeTab}
            data-testid={`profile-tab-${tab.id}`}
            style={
              {
                '--dash-delay': `${Math.min(index, 8) * 0.04}s`,
              } as React.CSSProperties
            }
            className="animate-dash-row-in shrink-0 snap-start whitespace-nowrap"
            onClick={() => {
              pushProfileEvent('tab_click', { tab: tab.id })
              onSelect(tab.id)
            }}
          />
        ))}
      </div>

      {/* Fade hints that the rail scrolls; purely decorative, mobile only. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background to-transparent md:hidden"
      />
    </div>
  )
}
