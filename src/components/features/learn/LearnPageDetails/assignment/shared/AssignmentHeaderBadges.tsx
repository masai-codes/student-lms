'use client'

import { Timer } from '@phosphor-icons/react'

import type { AssignmentHeaderBadge } from '@/server/learn/utils/buildAssignmentHeaderBadges'
import { MasaiChips } from '@/components/ui/masai-chips'

type AssignmentHeaderBadgesProps = {
  badges: Array<AssignmentHeaderBadge>
}

/** Distinct meta-row badges: deadline-enforced (timer) + weightage (evaluation only). */
export function AssignmentHeaderBadges({ badges }: AssignmentHeaderBadgesProps) {
  if (badges.length === 0) {
    return null
  }

  return (
    <>
      {badges.map((badge) =>
        badge.kind === 'deadline-enforced' ? (
          <MasaiChips
            key={badge.kind}
            type="left-icon"
            size="regular"
            label={badge.label}
            icon={<Timer weight="bold" aria-hidden />}
            backgroundClassName="bg-[#F6EDE7]"
            textClassName="!text-[#CC926E]"
            className="pointer-events-none"
            tabIndex={-1}
            data-testid={`assignment-header-badge-${badge.kind}`}
          />
        ) : (
          <MasaiChips
            key={badge.kind}
            type="default"
            size="regular"
            label={badge.label}
            backgroundClassName="bg-blue-50"
            textClassName="!text-blue-500"
            className="pointer-events-none"
            tabIndex={-1}
            data-testid={`assignment-header-badge-${badge.kind}`}
          />
        ),
      )}
    </>
  )
}
