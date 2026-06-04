import type { MasaiverseV2HomeClub } from '@/server/api/masaiverse-v2/services/getHomeClubs.service'
import { getInitials } from '@/lib/initials'

type HomeClubCardProps = {
  club: MasaiverseV2HomeClub
}

export default function HomeClubCard({ club }: HomeClubCardProps) {
  const hasMoreMembers = club.memberCount > club.sampleMemberNames.length

  return (
    <div className="flex h-full flex-col rounded-[14px] border border-[#EDEAE8] bg-white p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[#F3F0EE]">
          {club.imageUrl ? (
            <img
              src={club.imageUrl}
              alt={club.name}
              className="size-full object-cover"
            />
          ) : (
            <span className="text-[16px] font-bold text-[#6B7280]">
              {getInitials(club.name)}
            </span>
          )}
        </span>
        <div className="min-w-0">
          <p className="text-[16px] font-bold leading-5 text-[#111827]">
            {club.name}
          </p>
          {club.belowTitleCardText ? (
            <p className="mt-0.5 text-[13px] leading-4 text-[#6B7280]">
              {club.belowTitleCardText}
            </p>
          ) : null}
        </div>
      </div>

      {club.cardDescription ? (
        <p className="mt-3 text-[14px] leading-5 text-[#4B5563]">
          {club.cardDescription}
        </p>
      ) : null}

      {club.memberCount > 0 ? (
        <div className="mt-4 flex items-center gap-3">
          {club.sampleMemberNames.length > 0 ? (
            <div className="flex -space-x-2">
              {club.sampleMemberNames.map((name, index) => (
                <span
                  key={`${name}-${index}`}
                  className="flex size-7 items-center justify-center rounded-full border-2 border-white bg-masaiverse-orange/15 text-[10px] font-bold text-masaiverse-orange"
                >
                  {getInitials(name)}
                </span>
              ))}
              {hasMoreMembers ? (
                <span className="flex size-7 items-center justify-center rounded-full border-2 border-white bg-masaiverse-orange/15 text-[10px] font-bold text-masaiverse-orange">
                  +
                </span>
              ) : null}
            </div>
          ) : null}
          <p className="text-[13px] text-[#6B7280]">
            {club.memberCount.toLocaleString('en-IN')} members
          </p>
        </div>
      ) : null}
    </div>
  )
}
