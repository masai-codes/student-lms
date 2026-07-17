import type { MasaiverseV2HomeClub } from '@/server/api/masaiverse-v2/services/getHomeClubs.service'
import { getInitials } from '@/lib/initials'
import { formatMemberCount } from '@/lib/pluralize'

type HomeClubCardProps = {
  club: MasaiverseV2HomeClub
}

export default function HomeClubCard({ club }: HomeClubCardProps) {
  const hasMoreMembers = club.memberCount > club.sampleMemberNames.length

  return (
    <div className="flex h-full flex-col rounded-[14px] border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-surface-muted">
          {club.imageUrl ? (
            <img
              src={club.imageUrl}
              alt={club.name}
              className="size-full object-cover"
            />
          ) : (
            <span className="text-[16px] font-bold text-foreground-muted">
              {getInitials(club.name)}
            </span>
          )}
        </span>
        <div className="min-w-0">
          <p className="text-[16px] font-bold leading-5 text-foreground">
            {club.name}
          </p>
          {club.belowTitleCardText ? (
            <p className="mt-0.5 text-[13px] leading-4 text-foreground-muted">
              {club.belowTitleCardText}
            </p>
          ) : null}
        </div>
      </div>

      {club.cardDescription ? (
        <p className="mt-3 text-[14px] leading-5 text-foreground-muted">
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
                  className="flex size-7 items-center justify-center rounded-full border-2 border-white bg-accent-warm/15 text-[10px] font-bold text-accent-warm"
                >
                  {getInitials(name)}
                </span>
              ))}
              {hasMoreMembers ? (
                <span className="flex size-7 items-center justify-center rounded-full border-2 border-white bg-accent-warm/15 text-[10px] font-bold text-accent-warm">
                  +
                </span>
              ) : null}
            </div>
          ) : null}
          <p className="text-[13px] text-foreground-muted">
            {formatMemberCount(club.memberCount)}
          </p>
        </div>
      ) : null}
    </div>
  )
}
