import { useQuery } from '@tanstack/react-query'
import { Link, getRouteApi, useNavigate } from '@tanstack/react-router'
import { User } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { fetchProfile } from '@/lib/api/profile/profileApi'
import { ProfileDetailsTab } from './tabs/ProfileDetailsTab'
import { EmailPreferencesTab } from './tabs/EmailPreferencesTab'
import { AccountActivityTab } from './tabs/AccountActivityTab'
import { CertificatesTab } from './tabs/CertificatesTab'
import { ComingSoonTab } from './tabs/ComingSoonTab'
import { AchievementsSection } from './AchievementsSection'
import type { ProfileTab } from '@/routes/(protected)/_layout/profile/index'

// ── Tab config ────────────────────────────────────────────────────────────────

const TABS: Array<{ slug: ProfileTab; label: string }> = [
  { slug: 'profile-details', label: 'Profile Details' },
  { slug: 'acknowledgement', label: 'Acknowledgement' },
  { slug: 'account-activity', label: 'Account Activity' },
  { slug: 'certificates', label: 'Certificates' },
  { slug: 'email-preferences', label: 'Email Preferences' },
]

const routeApi = getRouteApi('/(protected)/_layout/profile/')

// ── Main Page ─────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const { tab } = routeApi.useSearch()
  const navigate = useNavigate()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    staleTime: 2 * 60 * 1000,
  })

  function handleTabChange(slug: ProfileTab) {
    void navigate({ to: '/profile', search: { tab: slug } })
  }

  return (
    <div className="mx-4 mb-6 mt-4 md:mx-8 flex flex-col gap-5">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                to="/"
                className="text-sm text-foreground-muted hover:text-foreground"
              >
                Home
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-sm text-foreground-muted">My Profile</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page title */}
      <h1 className="text-2xl font-bold text-foreground">My Profile</h1>

      {/* User header */}
      <div className="flex items-center gap-4">
        {isLoading ? (
          <div className="size-16 rounded-full bg-muted animate-pulse shrink-0" />
        ) : profile?.profileImageUrl ? (
          <img
            src={profile.profileImageUrl}
            alt={profile.name}
            className="size-16 rounded-full object-cover shrink-0 border border-border"
          />
        ) : (
          <div className="size-16 rounded-full bg-surface-muted border border-border flex items-center justify-center shrink-0">
            <User size={28} className="text-foreground-subtle" />
          </div>
        )}
        <div className="flex flex-col gap-0.5 min-w-0">
          {isLoading ? (
            <>
              <div className="h-5 w-48 rounded bg-muted animate-pulse" />
              <div className="h-4 w-36 rounded bg-surface-muted animate-pulse mt-1" />
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-foreground leading-snug break-words">
                {profile?.name}
              </p>
              <div className="flex items-center gap-1.5 text-sm text-foreground-muted">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="shrink-0"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                {profile?.email}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Achievements */}
      <AchievementsSection />

      {/* Tabs + content */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-border overflow-x-auto">
          {TABS.map(({ slug, label }) => (
            <button
              key={slug}
              type="button"
              onClick={() => handleTabChange(slug)}
              className={`shrink-0 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none border-b-2 -mb-px ${
                tab === slug
                  ? 'border-brand text-brand'
                  : 'border-transparent text-foreground-muted hover:text-foreground hover:border-border-strong'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {tab === 'profile-details' && <ProfileDetailsTab />}
          {tab === 'email-preferences' && <EmailPreferencesTab />}
          {tab === 'account-activity' && <AccountActivityTab />}
          {tab === 'certificates' && <CertificatesTab />}
          {tab !== 'profile-details' &&
            tab !== 'email-preferences' &&
            tab !== 'account-activity' &&
            tab !== 'certificates' && (
              <ComingSoonTab
                tab={TABS.find((t) => t.slug === tab)?.label ?? tab}
              />
            )}
        </div>
      </div>
    </div>
  )
}
