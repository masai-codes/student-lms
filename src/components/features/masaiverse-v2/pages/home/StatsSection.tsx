import { ACCENT_STYLES } from '../../accentStyles'
import { STATS_DUMMY_DATA } from '../../data/statsDummyData'

export default function StatsSection() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {STATS_DUMMY_DATA.map((stat) => {
        const accent = ACCENT_STYLES[stat.accent]
        return (
          <div
            key={stat.id}
            className="flex items-center gap-3 rounded-[16px] border border-[#EDEAE8] bg-white p-4"
          >
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-[12px] text-[18px]"
              style={{ backgroundColor: accent.iconBg }}
            >
              {stat.emoji}
            </span>
            <div className="min-w-0">
              <p
                className="text-[22px] font-bold leading-7"
                style={{ color: accent.value }}
              >
                {stat.value}
              </p>
              <p className="text-[13px] leading-4 text-[#6B7280]">
                {stat.label}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
