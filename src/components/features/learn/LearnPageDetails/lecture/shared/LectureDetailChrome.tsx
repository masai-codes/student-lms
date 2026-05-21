'use client'

import { LectureHostRow, LectureTitleStrip } from '../meta'
import type { ReactNode } from 'react'
import { lectureDetailContentClasses } from '@/lib/layout'
import { cn } from '@/lib/utils'

type LectureDetailChromeProps = {
  title: string
  hostName: string
  hostAvatarUrl: string | null
  scheduleDisplayRange: string
  hero: ReactNode
  belowHero?: ReactNode
  footer?: ReactNode
}

export function LectureDetailChrome({
  title,
  hostName,
  hostAvatarUrl,
  scheduleDisplayRange,
  hero,
  belowHero,
  footer,
}: LectureDetailChromeProps) {
  return (
    <div className="w-full pb-12">
      <section className="flex w-full shrink-0 flex-col overflow-visible bg-white">
        {hero}
        <div className={cn(lectureDetailContentClasses, 'relative z-20 shrink-0')}>
          <LectureTitleStrip title={title} />
          <LectureHostRow
            hostName={hostName}
            avatarUrl={hostAvatarUrl}
            dateRange={scheduleDisplayRange}
            className="border-b-0"
          />
          {belowHero}
        </div>
      </section>
      {footer ? (
        <div className={cn(lectureDetailContentClasses, 'bg-white')}>{footer}</div>
      ) : null}
    </div>
  )
}
