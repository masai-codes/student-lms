import { Link } from '@tanstack/react-router'
import { ArrowLeft, UsersThree } from '@phosphor-icons/react'
import { findClubById } from '../data/clubsDummyData'

type ClubDetailPageProps = {
  clubId: string
}

/**
 * Dedicated club page. Static dummy data for now, looked up by `clubId`.
 */
export default function ClubDetailPage({ clubId }: ClubDetailPageProps) {
  const club = findClubById(clubId)

  if (!club) {
    return (
      <div>
        <Link
          to="/masaiverse/clubs"
          search={(prev) => prev}
          className="inline-flex items-center gap-1 text-[14px] font-medium text-[#6B7280] hover:text-[#111827]"
        >
          <ArrowLeft size={16} />
          Back to clubs
        </Link>
        <h2 className="mt-4 text-[20px] font-bold leading-7 text-[#111827]">
          Club not found
        </h2>
        <p className="mt-1 text-[14px] leading-5 text-[#6B7280]">
          We couldn&apos;t find a club with id &quot;{clubId}&quot;.
        </p>
      </div>
    )
  }

  return (
    <div>
      <Link
        to="/masaiverse/clubs"
        search={(prev) => prev}
        className="inline-flex items-center gap-1 text-[14px] font-medium text-[#6B7280] hover:text-[#111827]"
      >
        <ArrowLeft size={16} />
        Back to clubs
      </Link>

      <div className="mt-4 flex items-center gap-4">
        <span className="text-[40px] leading-none">{club.icon}</span>
        <div>
          <h2 className="text-[24px] font-bold leading-8 text-[#111827]">
            {club.name}
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-[13px] leading-5 text-[#9CA3AF]">
            <UsersThree size={16} />
            {club.category} · {club.membersCount.toLocaleString()} members
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-[12px] border border-[#E5E7EB] p-4">
        <h3 className="text-[15px] font-semibold leading-5 text-[#111827]">
          About
        </h3>
        <p className="mt-2 text-[14px] leading-6 text-[#6B7280]">
          {club.description}
        </p>
      </div>
    </div>
  )
}
