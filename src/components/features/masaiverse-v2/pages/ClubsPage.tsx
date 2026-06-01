import { Link } from '@tanstack/react-router'
import { CLUBS_DUMMY_DATA } from '../data/clubsDummyData'

/**
 * Club listing ("Explore clubs") page. Static dummy data for now.
 */
export default function ClubsPage() {
  return (
    <div>
      <h2 className="text-[20px] font-bold leading-7 text-[#111827]">
        Explore clubs
      </h2>
      <p className="mt-1 text-[14px] leading-5 text-[#6B7280]">
        Discover communities and join the ones that match your interests.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CLUBS_DUMMY_DATA.map((club) => (
          <Link
            key={club.id}
            to="/masaiverse/club/$clubId"
            params={{ clubId: club.id }}
            search={(prev) => prev}
            className="flex flex-col rounded-[12px] border border-[#E5E7EB] p-4 transition-shadow hover:shadow-[0_4px_16px_rgba(17,24,39,0.06)]"
          >
            <div className="flex items-center gap-3">
              <span className="text-[24px] leading-none">{club.icon}</span>
              <div>
                <p className="text-[15px] font-semibold leading-5 text-[#111827]">
                  {club.name}
                </p>
                <p className="text-[12px] leading-4 text-[#9CA3AF]">
                  {club.category} · {club.membersCount.toLocaleString()} members
                </p>
              </div>
            </div>
            <p className="mt-3 line-clamp-2 text-[13px] leading-5 text-[#6B7280]">
              {club.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
