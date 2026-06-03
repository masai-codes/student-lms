import { ArrowRight } from 'lucide-react'
import type { EnrolledBatch } from '@/server/learn/types'
import type { BatchAttendance } from '@/server/api/dashboard/getDashboardAttendance.service'

interface ProgressStatConfig {
  id: 'attendance' | 'assignment'
  label: string
  unit: string
  iconSrc: string
  iconAlt: string
  viewReportHref?: string
}

const STAT_CONFIGS: Array<ProgressStatConfig> = [
  {
    id: 'attendance',
    label: 'Attendance',
    unit: '%',
    iconSrc: '/AttenDashboard.svg',
    iconAlt: 'Attendance',
    viewReportHref: '#',
  },
  {
    id: 'assignment',
    label: 'Assignment Score',
    unit: '/10',
    iconSrc: '/AssignDashboard.svg',
    iconAlt: 'Assignment Score',
    viewReportHref: '#',
  },
]

// ── Single progress card ───────────────────────────────────────────────────────

interface ProgressCardProps {
  title: string
  showAttendance: boolean
  showAssignment: boolean
  attendancePercentage: number | null
  assignmentScore: number | null
}

function ProgressCard({ title, showAttendance, showAssignment, attendancePercentage, assignmentScore }: ProgressCardProps) {
  const stats = STAT_CONFIGS.filter((s) =>
    (s.id === 'attendance' && showAttendance) ||
    (s.id === 'assignment' && showAssignment)
  )

  function getDisplayValue(id: ProgressStatConfig['id']): string {
    if (id === 'attendance') return attendancePercentage !== null ? String(attendancePercentage) : '—'
    if (id === 'assignment') return assignmentScore !== null ? String(assignmentScore) : '—'
    return '—'
  }

  if (stats.length === 0) return null

  return (
    <div className="bg-[#F9FAFB] rounded-[16px] border border-gray-200 p-4 flex flex-col gap-3">
      <h3
        className="type-b1-md font-semibold text-gray-900 truncate"
        title={title}
      >
        {title}
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
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
              {getDisplayValue(stat.id)}
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
  attendanceData: Array<BatchAttendance>
}

export function YourProgressPanel({ enrolledBatches, attendanceData }: YourProgressPanelProps) {
  const attendanceByBatchId = new Map(attendanceData.map((a) => [a.batchId, a]))

  if (enrolledBatches.length <= 1) {
    const batch = enrolledBatches[0]
    const batchData = batch ? attendanceByBatchId.get(batch.batchId) : undefined
    return (
      <ProgressCard
        title="Your Progress"
        showAttendance={batch?.showAttendanceReport ?? false}
        showAssignment={batch?.showEvaluationReport ?? false}
        attendancePercentage={batchData?.attendancePercentage ?? null}
        assignmentScore={batchData?.assignmentScore ?? null}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {enrolledBatches.map((batch) => {
        const batchData = attendanceByBatchId.get(batch.batchId)
        return (
          <ProgressCard
            key={batch.batchId}
            title={batch.courseTitle}
            showAttendance={batch.showAttendanceReport}
            showAssignment={batch.showEvaluationReport}
            attendancePercentage={batchData?.attendancePercentage ?? null}
            assignmentScore={batchData?.assignmentScore ?? null}
          />
        )
      })}
    </div>
  )
}
