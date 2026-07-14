import { cn } from '@/lib/utils'

export function TagChip({
  label,
  variant = 'default',
}: {
  label: string
  variant?: 'default' | 'highlight'
}) {
  return (
    <span
      className={cn(
        'rounded-full px-3 py-1 text-xs font-medium',
        variant === 'highlight'
          ? 'bg-yellow-100 text-yellow-700 dark:bg-warning-subtle dark:text-warning-subtle-foreground'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {label}
    </span>
  )
}
