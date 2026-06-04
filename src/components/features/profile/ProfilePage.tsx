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
import type { ProfileTab } from '@/routes/(protected)/_layout/profile/index'

// ── Tab config ────────────────────────────────────────────────────────────────

const TABS: Array<{ slug: ProfileTab; label: string }> = [
  { slug: 'profile-details', label: 'Profile Details' },
  { slug: 'zoom-integrations', label: 'Zoom Integrations' },
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
              <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-sm text-gray-500">My Profile</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page title */}
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

      {/* User header */}
      <div className="flex items-center gap-4">
        {isLoading ? (
          <div className="size-16 rounded-full bg-gray-200 animate-pulse shrink-0" />
        ) : profile?.profileImageUrl ? (
          <img
            src={profile.profileImageUrl}
            alt={profile.name}
            className="size-16 rounded-full object-cover shrink-0 border border-gray-200"
          />
        ) : (
          <div className="size-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
            <User size={28} className="text-gray-400" />
          </div>
        )}
        <div className="flex flex-col gap-0.5 min-w-0">
          {isLoading ? (
            <>
              <div className="h-5 w-48 rounded bg-gray-200 animate-pulse" />
              <div className="h-4 w-36 rounded bg-gray-100 animate-pulse mt-1" />
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-gray-900 leading-snug break-words">{profile?.name}</p>
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                {profile?.email}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs + content */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">

        {/* Tab bar */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {TABS.map(({ slug, label }) => (
            <button
              key={slug}
              type="button"
              onClick={() => handleTabChange(slug)}
              className={`shrink-0 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none border-b-2 -mb-px ${
                tab === slug
                  ? 'border-[#4F46E5] text-[#4F46E5]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
          {tab !== 'profile-details' && tab !== 'email-preferences' && tab !== 'account-activity' && tab !== 'certificates' && (
            <ComingSoonTab tab={TABS.find((t) => t.slug === tab)?.label ?? tab} />
          )}
        </div>
      </div>
    </div>
  )
}
