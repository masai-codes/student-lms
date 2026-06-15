import { Link } from '@tanstack/react-router'
import { Plus } from '@phosphor-icons/react'
import type { MasaiverseV2SidebarClub } from '@/server/api/masaiverse-v2/services/getMyClubs.service'
import { getInitials } from '@/lib/initials'
import { MASAIVERSE_EVENTS, trackMasaiverse } from './tracking'

type MyClubsSectionProps = {
  clubs: Array<MasaiverseV2SidebarClub>
  activeClubId?: string
  isLoading?: boolean
}

export default function MyClubsSection({
  clubs,
  activeClubId,
  isLoading,
}: MyClubsSectionProps) {
  return (
    <div className="mt-6 flex flex-col gap-1">
      <p className="px-4 pb-1 text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
        My Clubs
      </p>

      {isLoading ? (
        <div role="status" aria-label="Loading your clubs" className="flex flex-col gap-1">
          <span className="sr-only">Loading your clubs…</span>
          {[0, 1, 2].map((key) => (
            <div
              key={key}
              className="mx-2 h-10 animate-pulse rounded-[10px] bg-[#F3F0EE]"
            />
          ))}
        </div>
      ) : clubs.length === 0 ? (
        <p className="px-4 pb-1 text-[13px] leading-5 text-[#9CA3AF]">
          You haven&apos;t joined any clubs yet.
        </p>
      ) : (
        clubs.map((club) => (
          <Link
            key={club.id}
            to="/masaiverse/club/$clubId"
            params={{ clubId: club.id }}
            search={(prev) => prev}
            onClick={() =>
              trackMasaiverse(MASAIVERSE_EVENTS.clubCardClick, {
                club_id: club.id,
                source: 'sidebar_my_clubs',
              })
            }
            className={`flex items-center gap-2.5 rounded-[10px] px-4 py-[10px] ${
              club.id === activeClubId ? 'bg-masaiverse-orange/10' : 'hover:bg-[#FBF9F9]'
            }`}
          >
            <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-[#F3F0EE]">
              {club.imageUrl ? (
                <img
                  src={club.imageUrl}
                  alt={club.name}
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-[11px] font-bold text-[#6B7280]">
                  {getInitials(club.name)}
                </span>
              )}
            </span>
            <span className="truncate text-[14px] font-medium leading-5 text-[#111827]">
              {club.name}
            </span>
          </Link>
        ))
      )}

      <Link
        to="/masaiverse/clubs"
        search={(prev) => prev}
        onClick={() =>
          trackMasaiverse(MASAIVERSE_EVENTS.seeAllClick, {
            section: 'sidebar_my_clubs',
            to: 'clubs',
          })
        }
        className="mt-1 flex items-center justify-center gap-1 rounded-[10px] border border-dashed border-[#D1D5DB] px-4 py-[10px] text-[14px] font-medium text-[#6B7280] hover:bg-[#FBF9F9]"
      >
        <Plus size={16} weight="bold" />
        Explore clubs
      </Link>
    </div>
  )
}
