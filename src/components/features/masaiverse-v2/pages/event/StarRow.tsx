import { Star } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

type StarRowProps = {
  /** The committed rating (1–5, or 0 when none). */
  value: number
  /** The star currently hovered (interactive mode only). */
  hovered?: number
  readOnly?: boolean
  onHover?: (value: number) => void
  onSelect?: (value: number) => void
}

const STARS = [1, 2, 3, 4, 5]

/**
 * A row of five stars. Interactive by default — stars light up and spring on
 * hover, the active run scaling toward the cursor. Pass `readOnly` to render a
 * static, non-interactive display of `value`.
 */
export default function StarRow({
  value,
  hovered = 0,
  readOnly = false,
  onHover,
  onSelect,
}: StarRowProps) {
  const active = hovered || value

  if (readOnly) {
    return (
      <div
        className="flex gap-1"
        role="img"
        aria-label={`Rated ${value} out of 5`}
      >
        {STARS.map((star) => (
          <Star
            key={star}
            size={28}
            weight="fill"
            className={cn(
              'animate-masaiverse-star-pop',
              star <= value
                ? 'text-amber-400'
                : 'text-[#E5E7EB] dark:text-border-strong',
            )}
            style={{ animationDelay: `${star * 60}ms` }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-1.5">
      {STARS.map((star) => {
        const filled = star <= active
        const isHovered = hovered === star
        return (
          <button
            key={star}
            type="button"
            aria-label={`Rate ${star} ${star === 1 ? 'star' : 'stars'}`}
            aria-pressed={value === star}
            onMouseEnter={() => onHover?.(star)}
            onFocus={() => onHover?.(star)}
            onClick={() => onSelect?.(star)}
            className={cn(
              'origin-bottom transition-all duration-200 ease-out outline-none',
              'focus-visible:ring-2 focus-visible:ring-amber-300 rounded-md',
              isHovered
                ? 'scale-[1.35] -rotate-6'
                : filled
                  ? 'scale-110'
                  : 'scale-100 hover:scale-110',
            )}
          >
            <Star
              size={34}
              weight={filled ? 'fill' : 'regular'}
              className={cn(
                'transition-colors duration-200',
                filled
                  ? 'text-amber-400 drop-shadow-[0_2px_6px_rgba(251,191,36,0.45)]'
                  : 'text-foreground-subtle',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
