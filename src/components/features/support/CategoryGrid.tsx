import {
  Books,
  Briefcase,
  CalendarBlank,
  ChatCircleText,
  GraduationCap,
  Lifebuoy,
  Note,
  Wallet,
} from '@phosphor-icons/react'

import type { SupportCategory } from '@/server/api/support/support.types'
import { Pressable } from '@/components/ui/pressable'

/**
 * CategoryGrid — "Browse by topic" tiles.
 *
 * A responsive grid (2 cols on mobile → 4 on desktop) of tappable category
 * cards. Selecting one filters the FAQ list. Icons are matched by a few common
 * category keywords, with a sensible fallback so new categories still look
 * intentional without code changes.
 */
function iconForCategory(value: string): typeof Note {
  const v = value.toLowerCase()
  if (v.includes('assign')) return Note
  if (v.includes('eval') || v.includes('score')) return GraduationCap
  if (v.includes('leave') || v.includes('attend')) return CalendarBlank
  if (v.includes('place') || v.includes('job')) return Briefcase
  if (v.includes('fee') || v.includes('payment') || v.includes('kit')) return Wallet
  if (v.includes('course') || v.includes('curriculum')) return Books
  if (v.includes('feedback') || v.includes('doubt')) return ChatCircleText
  return Lifebuoy
}

export function CategoryGrid({
  categories,
  activeCategory,
  onSelect,
}: {
  categories: Array<SupportCategory>
  activeCategory?: string
  onSelect: (category: SupportCategory | null) => void
}) {
  if (categories.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((category) => {
        const Icon = iconForCategory(category.value)
        const active = activeCategory === category.value
        return (
          <Pressable
            key={category.value}
            onClick={() => onSelect(active ? null : category)}
            aria-pressed={active}
            className={[
              'flex flex-col items-start gap-3 rounded-2xl border p-4 text-left',
              active
                ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                : 'border-border bg-card hover:border-primary/40 hover:shadow-sm',
            ].join(' ')}
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-5" weight="duotone" />
            </span>
            <span className="text-sm font-semibold leading-tight text-foreground">
              {category.label}
            </span>
          </Pressable>
        )
      })}
    </div>
  )
}
