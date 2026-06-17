import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { CourseEvaluationItem } from '@/server/api/course/getCourseEvaluations.service'

interface Props {
  evaluations: CourseEvaluationItem[]
}

export function CourseEvaluations({ evaluations }: Props) {
  if (evaluations.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-semibold text-xl leading-8 text-gray-900">Evaluations</h2>

      <div className="flex gap-8 flex-wrap">
        {evaluations.map((ev, i) => (
          <div key={i} className="flex-1 rounded-2xl border border-gray-200 bg-white p-6 flex flex-col justify-between gap-4" style={{ minWidth: 280 }}>
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-1.5">
                <span className="font-semibold text-base leading-6 text-gray-700">{ev.label}</span>
                <div className="flex items-center gap-3 flex-wrap">
                  {ev.scheduleDisplay && (
                    <span className="text-sm font-medium" style={{ color: '#E74694' }}>{ev.scheduleDisplay}</span>
                  )}
                  {ev.scheduleDisplay && ev.durationMinutes > 0 && (
                    <span className="w-1 h-1 rounded-full shrink-0" style={{ background: '#E2E2E2' }} />
                  )}
                  {ev.durationMinutes > 0 && (
                    <span className="text-sm font-medium" style={{ color: '#7E3AF2' }}>{ev.durationMinutes} mins (Duration)</span>
                  )}
                </div>
              </div>
              {ev.description && (
                <div className="text-xs leading-[18px] text-gray-500 prose prose-xs max-w-none overflow-hidden break-words" style={{ maxHeight: '4.5rem' }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{ev.description}</ReactMarkdown>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3.5">
              {ev.status === 'COMPLETED' && (
                <button
                  className="flex items-center justify-center rounded-lg text-sm font-medium text-white cursor-pointer"
                  style={{ background: '#6962AC', padding: '10px 16px', height: 40 }}
                >
                  View Report Card
                </button>
              )}
              {(ev.status === 'UPCOMING' || ev.status === 'NOT_ATTEMPTED') && (
                <>
                  <button
                    className="flex items-center justify-center rounded-lg text-sm font-medium cursor-pointer"
                    style={{ background: '#EBF5FF', color: '#6962AC', padding: '10px 16px', height: 40 }}
                  >
                    View Admit Card
                  </button>
                  <button
                    className="flex items-center justify-center rounded-lg text-sm font-medium text-white cursor-pointer"
                    style={{ background: '#6962AC', padding: '10px 16px', height: 40 }}
                  >
                    Start Exam
                  </button>
                </>
              )}
              {ev.status === 'SCORE_PENDING' && (
                <button
                  className="flex items-center justify-center rounded-lg text-sm font-medium cursor-pointer"
                  style={{ background: '#EBF5FF', color: '#6962AC', padding: '10px 16px', height: 40 }}
                >
                  Score Pending
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
