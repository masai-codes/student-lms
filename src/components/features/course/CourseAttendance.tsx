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
      <h2 className="font-semibold text-xl leading-8 text-gray-900">Attendance</h2>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col gap-8">
        {data.groups.map((group, i) => (
          <div key={i} className="flex flex-col gap-1">
            <span className="text-sm font-medium" style={{ color: '#21191B' }}>{group.label}</span>
            {group.rules && (
              <div className="text-xs leading-[18px] text-gray-500 prose prose-xs max-w-none" style={{ maxWidth: 950 }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{group.rules}</ReactMarkdown>
              </div>
            )}
            <div className="flex items-center gap-3 mt-1">
              <div className="relative h-3 rounded-full" style={{ width: 474, background: '#DEF7EC' }}>
                <div
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{
                    width: `${Math.min(group.attendancePercentage, 100)}%`,
                    background: '#0E9F6E',
                  }}
                />
              </div>
              <span className="font-semibold text-sm text-gray-700">{group.attendancePercentage}%</span>
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <button
            className="flex items-center justify-center rounded-lg text-sm font-medium text-white cursor-pointer"
            style={{ background: '#6962AC', padding: '10px 16px', height: 40 }}
          >
            View Attendance Report
          </button>
        </div>
      </div>
    </div>
  )
}
