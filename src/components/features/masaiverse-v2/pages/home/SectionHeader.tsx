import type { ReactNode } from 'react'

type SectionHeaderProps = {
  title: string
  subtitle?: string
  action?: ReactNode
}

export default function SectionHeader({
  title,
  subtitle,
  action,
}: SectionHeaderProps) {
  return (
    // On phones the title/subtitle stack (subtitle below) with the action kept
    // top-right, so a long subtitle no longer crowds the title onto two lines
    // next to a squished link. From sm up it's the original single baseline row.
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
        <h2 className="text-[18px] font-bold leading-6 text-foreground sm:text-[20px] sm:leading-7">
          {title}
        </h2>
        {subtitle ? (
          <span className="text-[13px] text-foreground-subtle sm:text-[14px]">
            {subtitle}
          </span>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
