import { useMemo, useState } from 'react'
import { Medal } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { MasaiSelectDropdown } from '@/components/ui/masai-select-dropdown'
import { AchievementBadgeTile } from '@/components/features/profile/achievements/AchievementBadgeTile'
import { AchievementDialog } from '@/components/features/profile/achievements/AchievementDialog'
import {
  groupAchievements,
  resolveSelection,
} from '@/components/features/profile/achievements/groupAchievements'
import {
  ProfileEmptyState,
  ProfileTabPanel,
} from '@/components/features/profile/shared/ProfileStates'
import { profileAchievementsQuery } from '@/query/profile/profileQueries'
import { pushProfileEntityEvent } from '@/components/features/profile/shared/profileAnalytics'
import type { AchievementItem } from '@/server/api/profile/profile.types'

/** Pill row used for both grouping levels. */
function GroupPills({
  label,
  options,
  activeName,
  testIdPrefix,
  onSelect,
}: {
  label: string
  options: Array<{ name: string; count: number }>
  activeName: string | null
  testIdPrefix: string
  onSelect: (name: string) => void
}) {
  return (
    <div>
      <p className="mb-2 type-caption uppercase tracking-wide text-foreground-subtle">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = option.name === activeName
          return (
            <button
              key={option.name}
              type="button"
              data-testid={`${testIdPrefix}-${option.name}`}
              aria-pressed={isActive}
              className={`flex max-w-full items-center gap-1.5 rounded-full px-3.5 py-2 type-b2-md transition-colors active:scale-95 ${
                isActive
                  ? 'bg-brand text-brand-foreground'
                  : 'bg-surface-muted text-foreground-muted hover:bg-muted'
              }`}
              onClick={() => onSelect(option.name)}
            >
              <span className="truncate">{option.name}</span>
              <span
                className={`shrink-0 rounded-full px-1.5 type-caption ${
                  isActive
                    ? 'bg-brand-foreground/25 text-brand-foreground'
                    : 'bg-surface text-foreground-subtle'
                }`}
              >
                {option.count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function AchievementsPanel() {
  const { data, isLoading } = useQuery(profileAchievementsQuery())
  const [activeCourse, setActiveCourse] = useState<string | null>(null)
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [openItem, setOpenItem] = useState<AchievementItem | null>(null)

  const courses = useMemo(
    () => groupAchievements(data?.achievements ?? []),
    [data?.achievements],
  )

  // Keep both selections valid as data loads or the student's cohorts change.
  const courseName = resolveSelection(activeCourse, courses)
  const activeCourseGroup = courses.find((course) => course.name === courseName)
  const moduleName = resolveSelection(
    activeModule,
    activeCourseGroup?.modules ?? [],
  )
  const activeModuleGroup = activeCourseGroup?.modules.find(
    (moduleGroup) => moduleGroup.name === moduleName,
  )

  if (isLoading) {
    return (
      <ProfileTabPanel testId="profile-achievements-panel">
        <div data-testid="profile-achievements-skeleton" className="flex gap-3">
          <span className="sr-only">Loading…</span>
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="dash-skeleton size-[104px] rounded-xl"
            />
          ))}
        </div>
      </ProfileTabPanel>
    )
  }

  const total = data?.achievements.length ?? 0

  return (
    <ProfileTabPanel testId="profile-achievements-panel">
      <div className="flex items-center gap-2">
        <h2 className="type-h6 text-foreground">Achievements</h2>
        {total > 0 ? (
          <span
            data-testid="profile-achievements-total"
            className="animate-dash-pop rounded-full bg-brand-subtle px-2.5 py-0.5 type-caption text-brand-subtle-foreground"
          >
            {total}
          </span>
        ) : null}
      </div>

      {total === 0 ? (
        <ProfileEmptyState
          testId="profile-achievements-empty"
          icon={<Medal size={44} aria-hidden />}
          title="No badges yet"
          description="Badges appear here as you complete modules and assignments in your programme."
        />
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          <GroupPills
            label="Programs"
            options={courses}
            activeName={courseName}
            testIdPrefix="profile-achievements-course"
            onSelect={(name) => {
              setActiveCourse(name)
              setActiveModule(null)
            }}
          />

          <div className="rounded-xl bg-surface-muted p-3">
            {/* Mobile: a dropdown keeps long module lists from overflowing. */}
            <div className="md:hidden">
              <p className="mb-2 type-caption uppercase tracking-wide text-foreground-subtle">
                Modules
              </p>
              <MasaiSelectDropdown
                menuLabel="Modules"
                value={moduleName ?? ''}
                className="w-full"
                data-testid="profile-achievements-module-select"
                options={(activeCourseGroup?.modules ?? []).map(
                  (moduleGroup) => ({
                    label: `${moduleGroup.name} (${moduleGroup.count})`,
                    value: moduleGroup.name,
                  }),
                )}
                onValueChange={(value) => setActiveModule(value)}
              />
            </div>
            <div className="hidden md:block">
              <GroupPills
                label="Modules"
                options={activeCourseGroup?.modules ?? []}
                activeName={moduleName}
                testIdPrefix="profile-achievements-module"
                onSelect={(name) => setActiveModule(name)}
              />
            </div>
          </div>

          {(activeModuleGroup?.items.length ?? 0) === 0 ? (
            <p
              data-testid="profile-achievements-module-empty"
              className="type-b2-regular text-foreground-subtle"
            >
              No badges in this module yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {(activeModuleGroup?.items ?? []).map((item, index) => (
                <AchievementBadgeTile
                  key={item.badgeConfigId}
                  item={item}
                  index={index}
                  onOpen={(target) => {
                    pushProfileEntityEvent(
                      'open',
                      'badge',
                      target.badgeConfigId,
                      { title: target.badge.title, locked: target.isLocked },
                    )
                    setOpenItem(target)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <AchievementDialog
        item={openItem}
        shareBaseUrl={data?.shareBaseUrl ?? null}
        onClose={() => setOpenItem(null)}
      />
    </ProfileTabPanel>
  )
}
