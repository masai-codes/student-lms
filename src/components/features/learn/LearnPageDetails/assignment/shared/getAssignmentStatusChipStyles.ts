import type { AssignmentProgressStatus } from '@/server/learn/utils/calculateAssignmentProgressStatus'

type StatusChipStyles = {
  label: string
  backgroundClassName: string
  textClassName: string
}

const STATUS_CHIP_STYLES: Record<AssignmentProgressStatus, StatusChipStyles> = {
  completed: {
    label: 'Complete',
    backgroundClassName: 'bg-green-50 border border-green-200',
    textClassName: '!text-green-600',
  },
  overdue: {
    label: 'Over Due',
    backgroundClassName: 'bg-red-50 border border-red-200',
    textClassName: '!text-red-500',
  },
  'in-progress': {
    label: 'In Progress',
    backgroundClassName: 'bg-orange-50 border border-orange-200',
    textClassName: '!text-orange-500',
  },
  new: {
    label: 'New',
    backgroundClassName: 'bg-gray-50 border border-gray-200',
    textClassName: '!text-gray-600',
  },
}

export function getAssignmentStatusChipStyles(
  status: AssignmentProgressStatus,
  label?: string,
): StatusChipStyles {
  const base = STATUS_CHIP_STYLES[status]
  return {
    ...base,
    label: label ?? base.label,
  }
}
