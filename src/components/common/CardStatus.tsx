// components/shared/status.ts
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react'

export type CardStatus = 'completed' | 'in-progress' | 'warning'

export const statusConfig = {
  completed: {
    icon: CheckCircle,
    className: 'text-green-500 dark:text-success',
  },
  'in-progress': {
    icon: Clock,
    // Same-hue lift (warning token is amber, not orange) for dark contrast.
    className: 'text-orange-500 dark:text-orange-400',
  },
  warning: {
    icon: AlertTriangle,
    className: 'text-red-500 dark:text-danger',
  },
}
