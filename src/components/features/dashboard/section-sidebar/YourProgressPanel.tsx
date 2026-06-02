import { ArrowRight } from 'lucide-react'
import type { EnrolledBatch } from '@/server/learn/types'

interface ProgressStat {
  id: string
  label: string
  value: string
  unit: string
  iconSrc: string
  iconAlt: string
  viewReportHref?: string
}

const PROGRESS_STATS: Array<ProgressStat> = [
  {
    id: 'attendance',
    label: 'Attendance',
    value: '78',
    unit: '%',
    iconSrc: '/AttenDashboard.svg',
    iconAlt: 'Attendance',
    viewReportHref: '#',
  },
  {
    id: 'assignment',
    label: 'Assignment Score',
    value: '7.5',
    unit: '/10',
    iconSrc: '/AssignDashboard.svg',
    iconAlt: 'Assignment Score',
    viewReportHref: '#',
  },
]

// ── Single progress card ───────────────────────────────────────────────────────

interface ProgressCardProps {
  title: string
}

function ProgressCard({ title }: ProgressCardProps) {
  return (
    <div className="bg-[#F9FAFB] rounded-[16px] border border-gray-200 p-4 flex flex-col gap-3">
      <h3
        className="type-b1-md font-semibold text-gray-900 truncate"
        title={title}
      >
        {title}
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {PROGRESS_STATS.map((stat) => (
          <div
            key={stat.id}
            className="bg-white rounded-[12px] border border-gray-200 p-3 flex flex-col gap-2"
          >
            <img
              src={stat.iconSrc}
              alt={stat.iconAlt}
              width={40}
              height={40}
              className="size-10 object-contain"
              loading="lazy"
              decoding="async"
            />

            <p className="text-sm text-gray-500">{stat.label}</p>

            <p className="text-[28px] font-bold text-gray-900 leading-none">
              {stat.value}
              <span className="text-base font-semibold text-gray-500">{stat.unit}</span>
            </p>

            {stat.viewReportHref ? (
              <a
                href={stat.viewReportHref}
                className="flex items-center gap-1 text-sm font-medium text-[#6962AC] hover:underline focus-visible:outline-none"
              >
                View Report
                <ArrowRight size={14} />
              </a>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Panel ──────────────────────────────────────────────────────────────────────

interface YourProgressPanelProps {
  enrolledBatches: Array<EnrolledBatch>
}

export function YourProgressPanel({ enrolledBatches }: YourProgressPanelProps) {
  if (enrolledBatches.length <= 1) {
    return <ProgressCard title="Your Progress" />
  }

  return (
    <div className="flex flex-col gap-3">
      {enrolledBatches.map((batch) => (
        <ProgressCard key={batch.batchId} title={batch.courseTitle} />
      ))}
    </div>
  )
}
