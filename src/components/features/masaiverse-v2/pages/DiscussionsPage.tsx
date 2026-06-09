import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import CommunityDiscussionsSection from './home/CommunityDiscussionsSection'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { masaiverseV2MyClubsQuery } from '@/query/masaiverse-v2/clubsQuery'
import { DISCUSSIONS_PUBLIC_TAB as PUBLIC_TAB } from '@/query/masaiverse-v2/discussionsQuery'

const routeApi = getRouteApi('/(protected)/_layout/masaiverse/discussions')

/**
 * Community discussions page. A "Public" tab shows the club-less community feed
 * (`club_id IS NULL`); one tab per club the user has joined shows that club's
 * private discussions (`club_id = id`). Each tab reuses the shared discussions
 * feed (composer, search, "load more"), scoped by the club id it passes down.
 */
export default function DiscussionsPage() {
  const { data, isPending } = useQuery(masaiverseV2MyClubsQuery())
  const clubs = data ?? []

  // The active tab lives in the URL so "View all" links can deep-link to a
  // specific club's feed. Default to Public, and fall back to Public if the
  // requested club tab isn't one the user has joined — but only once clubs have
  // loaded, so a valid club deep-link isn't bounced to Public mid-fetch.
  const { tab } = routeApi.useSearch()
  const navigate = routeApi.useNavigate()
  const requested = tab ?? PUBLIC_TAB
  const tabExists =
    requested === PUBLIC_TAB || clubs.some((club) => club.id === requested)
  const activeTab = tabExists || isPending ? requested : PUBLIC_TAB

  const setTab = (value: string) =>
    void navigate({
      // Keep Public out of the URL so the default stays a clean `/discussions`.
      search: (prev) => ({
        ...prev,
        tab: value === PUBLIC_TAB ? undefined : value,
      }),
      replace: true,
    })

  return (
    <div>
      <h2 className="text-[20px] font-bold leading-7 text-[#111827]">
        Discussions
      </h2>
      <p className="mt-1 text-[14px] leading-5 text-[#6B7280]">
        Join the public conversation or catch up on discussions inside your
        clubs.
      </p>

      <Tabs value={activeTab} onValueChange={setTab} className="mt-5">
        <div className="overflow-x-auto">
          <TabsList className="bg-[#F1ECE8]">
            <TabsTrigger value={PUBLIC_TAB} className="px-3">
              Public
            </TabsTrigger>
            {clubs.map((club) => (
              <TabsTrigger key={club.id} value={club.id} className="px-3">
                <span className="max-w-[160px] truncate">{club.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value={PUBLIC_TAB} className="mt-5">
          <CommunityDiscussionsSection
            title="Public Discussions"
            hideViewAllLink
          />
        </TabsContent>

        {clubs.map((club) => (
          <TabsContent key={club.id} value={club.id} className="mt-5">
            <CommunityDiscussionsSection clubId={club.id} title={club.name} />
          </TabsContent>
        ))}
      </Tabs>

      {isPending ? (
        <p
          role="status"
          aria-label="Loading your clubs"
          className="mt-2 text-[13px] text-[#9CA3AF]"
        >
          Loading your clubs…
        </p>
      ) : null}
    </div>
  )
}
