import { useState } from 'react'
import type { CourseStructureModule } from '@/server/api/course/getCourseBatchData.service'

interface Props {
  modules: CourseStructureModule[]
}

function ModuleDot({ status }: { status: CourseStructureModule['status'] }) {
  if (status === 'completed') {
    return (
      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-success">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M2.5 7L5.5 10L11.5 4"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    )
  }
  if (status === 'inprogress') {
    return (
      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-brand-subtle">
        <div className="w-4 h-4 rounded-full bg-brand" />
      </div>
    )
  }
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-brand-subtle">
      <div className="w-4 h-4 rounded-full bg-brand" />
    </div>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      style={{
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s',
        flexShrink: 0,
      }}
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="#111928"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CourseStructure({ modules }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(
    modules.findIndex((m) => m.status === 'completed' && m.topics.length > 0),
  )

  if (modules.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-semibold text-xl leading-8 text-foreground">
        Program Structure
      </h2>

      <div className="rounded-2xl border border-border bg-surface p-6 flex flex-col gap-2">
        {modules.map((mod, i) => {
          const isOpen = openIndex === i
          const isLast = i === modules.length - 1
          const hasTopics = mod.topics.length > 0

          return (
            <div key={i} className="relative flex gap-3 isolate">
              {!isLast && (
                <div
                  className="absolute"
                  style={{
                    left: 13,
                    top: 28,
                    bottom: -2,
                    borderLeft: '1px dashed #D1D5DB',
                    zIndex: 0,
                  }}
                />
              )}

              <div className="relative z-10 mt-0.5 shrink-0">
                <ModuleDot status={mod.status} />
              </div>

              <div className="flex-1 pb-3">
                <button
                  className="w-full flex items-start justify-between gap-4 cursor-pointer text-left"
                  onClick={() => hasTopics && setOpenIndex(isOpen ? null : i)}
                >
                  <span className="text-sm font-medium text-foreground leading-[21px]">
                    {mod.code ? `${mod.code} - ${mod.title}` : mod.title}
                  </span>
                  {hasTopics && <ChevronIcon open={isOpen} />}
                </button>

                {isOpen && hasTopics && (
                  <ul className="mt-2 space-y-1 pl-0 list-none">
                    {mod.topics.map((topic, j) => (
                      <li
                        key={j}
                        className="flex gap-2 text-sm text-foreground leading-[21px]"
                      >
                        <span className="shrink-0">•</span>
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
