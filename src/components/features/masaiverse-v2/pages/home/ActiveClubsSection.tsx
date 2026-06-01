import { Link } from '@tanstack/react-router'
import { ACCENT_STYLES } from '../../accentStyles'
import { CLUBS_DUMMY_DATA } from '../../data/clubsDummyData'
import SectionHeader from './SectionHeader'

export default function ActiveClubsSection() {
  const clubs = CLUBS_DUMMY_DATA.slice(0, 3)

  return (
    <section>
      <SectionHeader
        title="Active Clubs"
        subtitle="join the conversation"
        action={
          <Link
            to="/masaiverse/clubs"
            search={(prev) => prev}
            className="text-[14px] font-medium text-[#EF8833] hover:underline"
          >
            All clubs →
          </Link>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clubs.map((club) => {
          const accent = ACCENT_STYLES[club.accent]
          return (
            <Link
              key={club.id}
              to="/masaiverse/club/$clubId"
              params={{ clubId: club.id }}
              search={(prev) => prev}
              className="flex items-center gap-3 rounded-[14px] border border-[#EDEAE8] bg-white p-4 transition-shadow hover:shadow-[0_4px_16px_rgba(17,24,39,0.06)]"
            >
              <span
                className="flex size-11 shrink-0 items-center justify-center rounded-[12px] text-[20px]"
                style={{ backgroundColor: accent.iconBg }}
              >
                {club.icon}
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-bold leading-5 text-[#111827]">
                  {club.name}
                </p>
                <p className="mt-0.5 text-[13px] leading-4 text-[#6B7280]">
                  {club.tagline}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
