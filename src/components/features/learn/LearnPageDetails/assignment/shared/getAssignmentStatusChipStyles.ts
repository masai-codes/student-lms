import type { AssignmentProgressStatus } from '@/server/learn/utils/calculateAssignmentProgressStatus'

type StatusChipStyles = {
  label: string
  backgroundClassName: string
  textClassName: string
}

const STATUS_CHIP_STYLES: Record<AssignmentProgressStatus, StatusChipStyles> = {
  completed: {
    label: 'Complete',
    backgroundClassName: 'bg-success-subtle border border-success-subtle',
    textClassName: '!text-success-subtle-foreground',
  },
  overdue: {
    label: 'Over Due',
    backgroundClassName: 'bg-danger-subtle border border-danger-subtle',
    textClassName: '!text-danger-subtle-foreground',
  },
  'in-progress': {
    label: 'In Progress',
    backgroundClassName: 'bg-warning-subtle border border-warning-subtle',
    textClassName: '!text-warning-subtle-foreground',
  },
  new: {
    label: 'New',
    backgroundClassName: 'bg-surface-muted border border-border',
    textClassName: '!text-foreground-muted',
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
