// components/shared/status.ts
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react'

export type CardStatus = 'completed' | 'in-progress' | 'warning'

export const statusConfig = {
  completed: {
    icon: CheckCircle,
    className: 'text-green-500',
  },
  'in-progress': {
    icon: Clock,
    className: 'text-orange-500',
  },
  warning: {
    icon: AlertTriangle,
    className: 'text-red-500',
  },
}
