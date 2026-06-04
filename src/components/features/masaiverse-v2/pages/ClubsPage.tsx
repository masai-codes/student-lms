import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { masaiverseV2HomeQuery } from '@/query/masaiverse-v2/homeQuery'
import { getInitials } from '@/lib/initials'

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
              className="flex flex-col rounded-[12px] border border-[#E5E7EB] p-4 transition-shadow hover:shadow-[0_4px_16px_rgba(17,24,39,0.06)]"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#F3F0EE]">
                  {club.imageUrl ? (
                    <img
                      src={club.imageUrl}
                      alt={club.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="text-[14px] font-bold text-[#6B7280]">
                      {getInitials(club.name)}
                    </span>
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold leading-5 text-[#111827]">
                    {club.name}
                  </p>
                  <p className="text-[12px] leading-4 text-[#9CA3AF]">
                    {club.memberCount.toLocaleString('en-IN')} members
                  </p>
                </div>
              </div>
              {club.cardDescription ? (
                <p className="mt-3 line-clamp-2 text-[13px] leading-5 text-[#6B7280]">
                  {club.cardDescription}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
