import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import type { SupportFaq } from '@/server/api/support/support.types'
import BottomDrawer from '@/components/ui/bottom-drawer'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createSupportTicket } from '@/lib/api/support/supportApi'

/**
 * CreateTicketSheet — the guided "raise a ticket" flow.
 *
 * Opens from an FAQ that didn't help (or a category), so the category +
 * subcategory are **pre-filled and read-only** — the student only writes the
 * message. On success it invalidates the overview (so the open-tickets strip
 * updates) and routes straight into the new conversation, never back to a list.
 *
 * Uses the native, swipeable {@link BottomDrawer} for a premium mobile feel.
 */
export function CreateTicketSheet({
  open,
  onClose,
  batchId,
  context,
}: {
  open: boolean
  onClose: () => void
  batchId: number
  /** The originating category/subcategory (+ FAQ), pre-filled into the ticket. */
  context: { category: string; subCategory?: string | null; faq?: SupportFaq | null }
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')

  const createMutation = useMutation({
    mutationFn: () =>
      createSupportTicket({
        batchId,
        category: context.category,
        subCategory: context.subCategory ?? null,
        message,
        questionId: context.faq?.id ?? null,
      }),
    onSuccess: ({ id }) => {
      void queryClient.invalidateQueries({ queryKey: ['support', 'overview'] })
      onClose()
      setMessage('')
      void navigate({ to: '/support/$supportId', params: { supportId: String(id) } })
    },
  })

  const label = [context.category, context.subCategory]
    .filter(Boolean)
    .map((s) => String(s).replace(/[-_]/g, ' '))
    .join(' › ')

  return (
    <BottomDrawer open={open} onClose={onClose} title="Raise a support ticket">
      <div className="space-y-4 pb-2">
        {/* Pre-filled context — the student doesn't re-pick a category. */}
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium capitalize text-primary">
          {label || context.category}
        </div>

        {context.faq && (
          <p className="text-sm text-muted-foreground">
            Re: <span className="font-medium text-foreground">{context.faq.question}</span>
          </p>
        )}

        <div className="space-y-1.5">
          <label htmlFor="ticket-message" className="text-sm font-medium text-foreground">
            Describe your issue
          </label>
          <Textarea
            id="ticket-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Tell us what happened — include dates, links or screenshots where you can."
            className="resize-none"
          />
        </div>

        {createMutation.isError && (
          <p className="text-sm text-destructive">
            Couldn’t create your ticket. Please try again.
          </p>
        )}

        <Button
          className="w-full"
          size="lg"
          disabled={!message.trim() || createMutation.isPending}
          onClick={() => createMutation.mutate()}
        >
          {createMutation.isPending ? 'Submitting…' : 'Submit ticket'}
        </Button>
      </div>
    </BottomDrawer>
  )
}
