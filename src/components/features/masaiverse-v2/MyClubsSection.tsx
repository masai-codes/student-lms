import { Link } from '@tanstack/react-router'
import { Plus } from '@phosphor-icons/react'
import type { MasaiverseClub } from './types'

type MyClubsSectionProps = {
  clubs: Array<MasaiverseClub>
  activeClubId?: string
}

export default function MyClubsSection({
  clubs,
  activeClubId,
}: MyClubsSectionProps) {
  return (
    <div className="mt-6 flex flex-col gap-1">
      <p className="px-4 pb-1 text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
        My Clubs
      </p>

      {clubs.map((club) => (
        <Link
          key={club.id}
          to="/masaiverse/club/$clubId"
          params={{ clubId: club.id }}
          search={(prev) => prev}
          className={`flex items-center gap-2.5 rounded-[10px] px-4 py-[10px] ${
            club.id === activeClubId ? 'bg-[#FBF1E8]' : 'hover:bg-[#FBF9F9]'
          }`}
        >
          <span className="text-[18px] leading-none">{club.icon}</span>
          <span className="text-[14px] font-medium leading-5 text-[#111827]">
            {club.name}
          </span>
        </Link>
      ))}

      <Link
        to="/masaiverse/clubs"
        search={(prev) => prev}
        className="mt-1 flex items-center justify-center gap-1 rounded-[10px] border border-dashed border-[#D1D5DB] px-4 py-[10px] text-[14px] font-medium text-[#6B7280] hover:bg-[#FBF9F9]"
      >
        <Plus size={16} weight="bold" />
        Explore clubs
      </Link>
    </div>
  )
}
