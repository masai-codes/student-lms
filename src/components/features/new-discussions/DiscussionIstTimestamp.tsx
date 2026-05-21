import { formatIstDiscussionDateTime } from '@/lib/socialRelativeTime'
import { cn } from '@/lib/utils'

type DiscussionIstTimestampProps = {
  value: string | null
  className?: string
}

/** IST posted-at line using timestamp typography (`type-t2`, 12px Inter). */
export function DiscussionIstTimestamp({ value, className }: DiscussionIstTimestampProps) {
  const label = formatIstDiscussionDateTime(value)
  if (!label) return null

  return <p className={cn('type-t2 text-gray-500', className)}>{label}</p>
}
