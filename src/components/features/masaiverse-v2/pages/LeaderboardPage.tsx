import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import GlobalLeaderboardSection from './leaderboard/GlobalLeaderboardSection'
import AssignPointsButton from './leaderboard/AssignPointsButton'
import ClubLeaderboardSection from './club/ClubLeaderboardSection'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { masaiverseV2MyClubsQuery } from '@/query/masaiverse-v2/clubsQuery'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../tracking'

/** The "Global" tab uses a reserved value; club tabs key off their numeric id. */
const GLOBAL_TAB = 'global'

/**
 * Leaderboard page. A "Global leaderboard" tab ranks the whole community by
 * total all-time points; one tab per club the user has joined ranks that club's
 * members by their club-scoped points. Each tab reuses the existing leaderboard
 * sections — the global board and the club board — so scoring stays consistent.
 */
export default function LeaderboardPage() {
  const { data, isPending } = useQuery(masaiverseV2MyClubsQuery())
  const clubs = data ?? []
  const [tab, setTab] = useState<string>(GLOBAL_TAB)

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-bold leading-7 text-[#111827]">
            Leaderboard
          </h2>
          <p className="mt-1 text-[14px] leading-5 text-[#6B7280]">
            See who&apos;s leading across the community and inside your clubs.
          </p>
        </div>
        <AssignPointsButton />
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          trackMasaiverse(MASAIVERSE_EVENTS.leaderboardTabChange, {
            tab: value === GLOBAL_TAB ? 'global' : 'club',
            club_id: value === GLOBAL_TAB ? undefined : value,
          })
          setTab(value)
        }}
        className="mt-5"
      >
        <div className="overflow-x-auto">
          <TabsList className="bg-[#F1ECE8]">
            <TabsTrigger value={GLOBAL_TAB} className="px-3">
              Global leaderboard
            </TabsTrigger>
            {clubs.map((club) => (
              <TabsTrigger key={club.id} value={club.id} className="px-3">
                <span className="max-w-[160px] truncate">{club.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value={GLOBAL_TAB} className="mt-5">
          <GlobalLeaderboardSection />
        </TabsContent>

        {clubs.map((club) => (
          <TabsContent key={club.id} value={club.id} className="mt-5">
            <ClubLeaderboardSection clubId={club.id} />
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
