'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

type LectureHostRowProps = {
  hostName: string
  avatarUrl: string | null
  dateRange: string
  className?: string
}

function hostInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

/** Channel-style host row below the title strip. */
export function LectureHostRow({
  hostName,
  avatarUrl,
  dateRange,
  className,
}: LectureHostRowProps) {
  return (
    <section
      className={cn(
        'flex items-start gap-3 border-b border-border bg-background  py-4 ',
        className,
      )}
    >
      <Avatar
        size="lg"
        className="size-10 shrink-0 ring-2 ring-[#4F6BED]/15 ring-offset-2 ring-offset-background transition-transform duration-300 hover:scale-105"
      >
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={hostName} /> : null}
        <AvatarFallback className="type-b2-md bg-muted text-gray-700">
          {hostInitials(hostName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="type-b1-md break-words text-gray-900">{hostName}</p>
        {dateRange ? (
          <p className="type-b2-regular mt-0.5 text-gray-600">{dateRange}</p>
        ) : null}
      </div>
    </section>
  )
}
