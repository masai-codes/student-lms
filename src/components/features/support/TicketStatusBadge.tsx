import {
  CheckCircle,
  Circle,
  ClockClockwise,
  Lock,
  Sparkle,
} from '@phosphor-icons/react'

import type { TicketStatus } from '@/server/api/support/support.types'
import { cn } from '@/lib/utils'

/**
 * TicketStatusBadge — the colour-independent status pill.
 *
 * Status is conveyed by **icon + label + colour together** (never colour alone)
 * so it's accessible. One config object maps every {@link TicketStatus} to its
 * look, keeping all status styling in a single, scannable place.
 */
const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; icon: typeof Circle; className: string }
> = {
  open: {
    label: 'Open',
    icon: Circle,
    className: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  },
  're-opened': {
    label: 'Reopened',
    icon: ClockClockwise,
    className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  },
  resolved: {
    label: 'Resolved',
    icon: CheckCircle,
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  },
  closed: {
    label: 'Closed',
    icon: Lock,
    className: 'bg-gray-100 text-gray-600 ring-gray-500/20',
  },
  automatic: {
    label: 'Auto-resolved',
    icon: Sparkle,
    className: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  },
}

export function TicketStatusBadge({
  status,
  className,
}: {
  status: TicketStatus
  className?: string
}) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        config.className,
        className,
      )}
    >
      <Icon weight="fill" className="size-3" />
      {config.label}
    </span>
  )
}
