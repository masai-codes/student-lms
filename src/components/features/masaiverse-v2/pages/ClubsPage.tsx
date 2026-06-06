import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import HomeClubCard from './home/HomeClubCard'
import { masaiverseV2HomeQuery } from '@/query/masaiverse-v2/homeQuery'

/**
 * Club listing ("Explore clubs") page. Reuses the live home clubs payload so
 * each card links to the real club detail page by its id.
 */
export default function ClubsPage() {
  const { data, isPending } = useQuery(masaiverseV2HomeQuery())
  const clubs = data?.clubs ?? []

  return (
    <div>
      <h2 className="text-[20px] font-bold leading-7 text-[#111827]">
        Explore clubs
      </h2>
      <p className="mt-1 text-[14px] leading-5 text-[#6B7280]">
        Discover communities and join the ones that match your interests.
      </p>

      {isPending ? (
        <div
          role="status"
          aria-label="Loading clubs"
          className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <span className="sr-only">Loading clubs…</span>
          {[0, 1, 2].map((key) => (
            <div
              key={key}
              className="h-28 animate-pulse rounded-[12px] bg-[#ECE7E2]"
            />
          ))}
        </div>
      ) : clubs.length === 0 ? (
        <p className="mt-6 text-[14px] text-[#6B7280]">No clubs yet.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => (
            <Link
              key={club.id}
              to="/masaiverse/club/$clubId"
              params={{ clubId: club.id }}
              search={(prev) => prev}
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
