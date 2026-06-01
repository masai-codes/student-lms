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
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-[20px] font-bold leading-7 text-[#111827]">
          {title}
        </h2>
        {subtitle ? (
          <span className="text-[14px] text-[#9CA3AF]">{subtitle}</span>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
