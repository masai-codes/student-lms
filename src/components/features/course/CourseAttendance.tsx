import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { CourseAttendanceData } from '@/server/api/course/getCourseAttendance.service'

interface Props {
  data: CourseAttendanceData
}

export function CourseAttendance({ data }: Props) {
  if (data.groups.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-semibold text-xl leading-8 text-foreground">
        Attendance
      </h2>

      <div className="rounded-2xl border border-border bg-surface p-6 flex flex-col gap-8">
        {data.groups.map((group, i) => (
          <div key={i} className="flex flex-col gap-1">
            <span className="text-sm font-medium text-foreground">
              {group.label}
            </span>
            {group.rules && (
              <div
                className="text-xs leading-[18px] text-foreground-muted prose prose-xs max-w-none"
                style={{ maxWidth: 950 }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {group.rules}
                </ReactMarkdown>
              </div>
            )}
            <div className="flex items-center gap-3 mt-1">
              <div
                className="relative h-3 rounded-full bg-success-subtle"
                style={{ width: 474 }}
              >
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-success"
                  style={{
                    width: `${Math.min(group.attendancePercentage, 100)}%`,
                  }}
                />
              </div>
              <span className="font-semibold text-sm text-foreground">
                {group.attendancePercentage}%
              </span>
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <button
            className="flex items-center justify-center rounded-lg text-sm font-medium text-brand-foreground cursor-pointer bg-brand"
            style={{ padding: '10px 16px', height: 40 }}
          >
            View Attendance Report
          </button>
        </div>
      </div>
    </div>
  )
}
