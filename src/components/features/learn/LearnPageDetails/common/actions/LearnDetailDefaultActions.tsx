'use client'

import { Bookmark } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

import { MasaiButton } from '@/components/ui/masai-button'

/** Default CTAs for lecture / assignment / resource detail headers. */
export function LearnDetailDefaultActions() {
  const navigate = useNavigate()

  return (
    <>
      <MasaiButton
        type="secondary"
        size="md"
        ctaText="Raise Ticket"
        htmlType="button"
        onClick={() =>
          navigate({ to: '/support', search: { page: undefined } })
        }
      />
      {/* Bookmark flow not wired yet. */}
      <MasaiButton
        type="tertiary"
        size="md"
        icon={<Bookmark strokeWidth={1.75} className="size-5" />}
        iconOnly
        htmlType="button"
        aria-label="Bookmark"
        onClick={() => undefined}
      />
    </>
  )
}
