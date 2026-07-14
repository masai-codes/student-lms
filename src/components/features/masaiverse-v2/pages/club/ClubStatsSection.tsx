import { useQuery } from '@tanstack/react-query'
import { ACCENT_STYLES } from '../../accentStyles'
import ResponsiveCardCarousel from '../home/ResponsiveCardCarousel'
import { CLUB_STAT_CARDS, formatClubStat } from './clubStatsConfig'
import type { MasaiverseV2ClubStats } from '@/server/api/masaiverse-v2/services/getClubStats.service'
import { masaiverseV2ClubStatsQuery } from '@/query/masaiverse-v2/clubsQuery'

type ClubStatsSectionProps = {
  clubId: string
  /**
   * Stats embedded in the club detail payload. When provided they seed the
   * query so this section renders without an extra request.
   */
  initialStats?: MasaiverseV2ClubStats | null
}

/**
 * Second section of the club page — a four-card row of headline stats
 * (active members, average event rating, projects built, community posts),
 * fetched live by `clubId`. Missing data renders as an em dash.
 */
export default function ClubStatsSection({
  clubId,
  initialStats,
}: ClubStatsSectionProps) {
  const { data, isPending, isError } = useQuery({
    ...masaiverseV2ClubStatsQuery(clubId),
    ...(initialStats ? { initialData: initialStats } : {}),
  })

  return (
    <section>
      <ResponsiveCardCarousel
        items={CLUB_STAT_CARDS}
        getKey={(card) => card.id}
        navKey="club-stats"
        navLabel="stats"
        // Fixed-width cards (capped) so they don't sprawl into empty space on
        // wide screens / when the side panel is closed; extras scroll.
        slideWidth="!w-[200px] sm:!w-[240px]"
        renderItem={(card) => {
          const accent = ACCENT_STYLES[card.accent]
          return (
            <div className="flex h-full flex-col gap-4 rounded-[20px] border border-border bg-surface p-5 sm:p-6">
              <span
                className="flex size-12 items-center justify-center rounded-[14px] text-[22px]"
                style={{ backgroundColor: accent.iconBg }}
              >
                {card.emoji}
              </span>
              {isPending ? (
                <div
                  className="h-9 w-16 animate-pulse rounded bg-surface-muted"
                  aria-hidden
                />
              ) : (
                <p className="text-[34px] font-extrabold leading-9 text-foreground">
                  {isError ? '—' : formatClubStat(card, data)}
                </p>
              )}
              <div>
                <p className="text-[14px] leading-5 text-foreground-muted">
                  {card.label}
                </p>
                {card.sublabel ? (
                  <p className="mt-0.5 text-[12px] leading-4 text-foreground-subtle">
                    {card.sublabel}
                  </p>
                ) : null}
              </div>
            </div>
          )
        }}
      />
    </section>
  )
}
