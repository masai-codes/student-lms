'use client'

import { AssociatedContentList } from './AssociatedContentList'
import { ASSOCIATED_CONTENT_DRAWER_TITLE } from './associatedContentLabels'

import { MasaiDrawer } from '@/components/ui/masai-drawer'
import type { LearnAssociatedListItem } from '@/server/learn/learnAssociatedTypes'

type AssociatedContentDrawerProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  items: Array<LearnAssociatedListItem>
  bottomInsetPx?: number
}

export function AssociatedContentDrawer({
  isOpen,
  onOpenChange,
  items,
  bottomInsetPx = 0,
}: AssociatedContentDrawerProps) {
  return (
    <MasaiDrawer
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      direction="right"
      sideMarginInPx={16}
      bottomInsetPx={bottomInsetPx}
      title={ASSOCIATED_CONTENT_DRAWER_TITLE}
      content={<AssociatedContentList items={items} />}
    />
  )
}
