import dayjs from 'dayjs'
import type { CourseTimelineItem } from '@/server/api/course/getCourseBatchData.service'

interface Props {
  items: CourseTimelineItem[]
}

function MilestoneDot({ status }: { status: CourseTimelineItem['status'] }) {
  if (status === 'completed') {
    return (
      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: '#0E9F6E' }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    )
  }
  if (status === 'inprogress') {
    return (
      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: '#EBEAFA' }}>
        <div className="w-4 h-4 rounded-full" style={{ background: '#6962AC' }} />
      </div>
    )
  }
  return <div className="w-7 h-7 rounded-full shrink-0" style={{ background: '#F3F4F6' }} />
}

export function CourseTimeline({ items }: Props) {
  if (items.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-semibold text-xl leading-8 text-gray-900">Course Timeline</h2>

      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 overflow-x-auto">
        <div className="relative flex items-start gap-12 min-w-max">
          <div
            className="absolute top-3.5 left-0 right-0"
            style={{ borderTop: '2px dashed #EDEBFE', zIndex: 0 }}
          />
          {items.map((m, i) => (
            <div key={i} className="flex flex-col items-center gap-3 relative z-10">
              <MilestoneDot status={m.status} />
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-medium text-center text-gray-900 whitespace-nowrap">{dayjs(m.date).format('D MMM, YYYY')}</span>
                <span className="text-xs font-medium text-center leading-[1.2] max-w-[120px]" style={{ color: '#3F83F8' }}>
                  {m.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
