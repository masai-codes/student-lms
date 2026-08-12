import type { CourseBatchData } from '@/server/api/course/getCourseBatchData.service'

interface Props {
  data: CourseBatchData
}

export function CourseHeroCard({ data }: Props) {
  return (
    <div
      className="w-full rounded-2xl border border-border bg-surface overflow-hidden flex"
      style={{ minHeight: 380 }}
    >
      {/* Left content */}
      <div className="flex flex-col justify-center gap-8 px-6 py-6 w-1/2 shrink-0">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <h1 className="font-bold text-2xl leading-8 text-foreground">
              {data.courseTitle}
            </h1>
            {data.instituteName && (
              <p className="text-base leading-6 text-foreground">
                from <span className="font-semibold">{data.instituteName}</span>
              </p>
            )}
          </div>

          {data.courseDetails.length > 0 && (
            <ul className="text-sm leading-[21px] text-foreground space-y-0.5 list-none pl-0">
              {data.courseDetails.map((detail, i) => (
                <li key={i} className="flex gap-2">
                  <span className="shrink-0">•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground-muted">
              Student Code:
            </span>
            <div className="flex items-center px-3 h-8 rounded-full bg-info-subtle">
              <span className="text-sm font-medium text-info">
                {data.studentCode}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="relative h-2.5 rounded-full bg-success-subtle">
              {/* Vivid green progress fill — reads fine on both themes' success-subtle track. */}
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-[#31C48D]"
                style={{ width: `${data.courseProgress}%` }}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-xs font-medium text-foreground-muted">
                Program Progress
              </span>
              <span className="text-xs font-medium text-foreground">
                {data.courseProgress}%
              </span>
            </div>
          </div>

          <button
            className="flex items-center justify-center rounded-lg text-sm font-medium text-brand-foreground shrink-0 cursor-pointer bg-brand"
            style={{ padding: '10px 16px', height: 40 }}
          >
            Resume Learning
          </button>
        </div>
      </div>

      {/* Right image */}
      <div className="flex-1 relative overflow-hidden bg-[#D1D5DB] dark:bg-muted">
        {data.courseImage && (
          <img
            src={data.courseImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
      </div>
    </div>
  )
}
