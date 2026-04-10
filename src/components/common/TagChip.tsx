import { cn } from "@/lib/utils"

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
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-muted text-muted-foreground'
      )}
    >
      {label}
    </span>
  )
}
