import { Trophy } from '@phosphor-icons/react'
import { LEADERS_DUMMY_DATA } from '../../../data/leadersDummyData'

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
}

export default function ThisMonthLeaders() {
  return (
    <div>
      <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
        <Trophy size={14} />
        This month&apos;s leaders
      </p>
      <div className="flex flex-col gap-3">
        {LEADERS_DUMMY_DATA.map((leader, index) => (
          <div key={leader.id} className="flex items-center gap-2">
            <span className="w-4 text-center text-[13px] leading-none">
              {leader.medal ?? index + 1}
            </span>
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-white"
              style={{ backgroundColor: leader.avatarColor }}
            >
              {getInitials(leader.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold leading-4 text-[#111827]">
                {leader.name}
              </p>
              <p className="truncate text-[11px] leading-4 text-[#9CA3AF]">
                {leader.role}
              </p>
            </div>
            <span className="text-[13px] font-bold text-masaiverse-orange">
              {leader.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
