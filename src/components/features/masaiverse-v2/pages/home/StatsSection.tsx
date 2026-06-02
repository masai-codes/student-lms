import { useQuery } from '@tanstack/react-query'
import { ACCENT_STYLES } from '../../accentStyles'
import { STAT_CARDS } from '../../data/statsConfig'
import { masaiverseV2HomeQuery } from '@/query/masaiverse-v2/homeQuery'

export default function StatsSection() {
  const { data, isPending, isError } = useQuery(masaiverseV2HomeQuery())

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {STAT_CARDS.map((card) => {
        const accent = ACCENT_STYLES[card.accent]
        const count = data?.stats[card.metric]
        return (
          <div
            key={card.id}
            className="flex items-center gap-3 rounded-[16px] border border-[#EDEAE8] bg-white p-4"
          >
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-[12px] text-[18px]"
              style={{ backgroundColor: accent.iconBg }}
            >
              {card.emoji}
            </span>
            <div className="min-w-0">
              {isPending ? (
                <div
                  className="h-7 w-12 animate-pulse rounded bg-[#EDEAE8]"
                  aria-hidden
                />
              ) : (
                <p
                  className="text-[22px] font-bold leading-7"
                  style={{ color: accent.value }}
                >
                  {isError || count == null
                    ? '—'
                    : count.toLocaleString('en-IN')}
                </p>
              )}
              <p className="text-[13px] leading-4 text-[#6B7280]">
                {card.label}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
