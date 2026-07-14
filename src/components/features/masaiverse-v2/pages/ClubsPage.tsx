import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import AdminCreateButton from '../AdminCreateButton'
import HomeClubCard from './home/HomeClubCard'
import { masaiverseV2HomeQuery } from '@/query/masaiverse-v2/homeQuery'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../tracking'

/**
 * Club listing ("Explore clubs") page. Reuses the live home clubs payload so
 * each card links to the real club detail page by its id.
 */
export default function ClubsPage() {
  const { data, isPending } = useQuery(masaiverseV2HomeQuery())
  const clubs = data?.clubs ?? []

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-bold leading-7 text-foreground">
            Explore clubs
          </h2>
          <p className="mt-1 text-[14px] leading-5 text-foreground-muted">
            Discover communities and join the ones that match your interests.
          </p>
        </div>
        <AdminCreateButton kind="club" />
      </div>

      {isPending ? (
        <div
          role="status"
          aria-label="Loading clubs"
          className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-4"
        >
          <span className="sr-only">Loading clubs…</span>
          {[0, 1, 2].map((key) => (
            <div
              key={key}
              className="h-28 animate-pulse rounded-[12px] bg-surface-muted"
            />
          ))}
        </div>
      ) : clubs.length === 0 ? (
        <p className="mt-6 text-[14px] text-foreground-muted">No clubs yet.</p>
      ) : (
        <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-4">
          {clubs.map((club) => (
            <Link
              key={club.id}
              to="/masaiverse/club/$clubId"
              params={{ clubId: club.id }}
              search={(prev) => prev}
              onClick={() =>
                trackMasaiverse(MASAIVERSE_EVENTS.clubCardClick, {
                  club_id: club.id,
                  source: 'clubs',
                })
              }
              className="flex rounded-[14px] transition-shadow hover:shadow-[0_4px_16px_rgba(17,24,39,0.06)] [&>div]:w-full"
            >
              <HomeClubCard club={club} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
