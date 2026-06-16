import { useState } from 'react'
import {
  ArrowBendUpRight,
  ArrowClockwise,
  PaperPlaneRight,
  ThumbsDown,
  ThumbsUp,
} from '@phosphor-icons/react'

import type {
  TicketCapabilities,
  TicketRating,
} from '@/server/api/support/support.types'
import { Button } from '@/components/ui/button'
import { Pressable } from '@/components/ui/pressable'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

/**
 * TicketActionFooter — the single, status-aware "what's my next step" surface.
 *
 * It renders **exactly one** primary affordance, chosen from `capabilities`
 * (which the server computes from status + rating):
 *   - canReply   → a reply composer (sticky on mobile, above the keyboard)
 *   - canRate    → "Did this resolve it?" 👍/👎, then reopen/escalate if allowed
 *
 * This component is presentational: the parent (`TicketConversation`) passes the
 * mutation callbacks + pending flags. Keeping the decision in `capabilities`
 * means there are no scattered status checks here.
 */
export function TicketActionFooter({
  capabilities,
  tatHours,
  pending,
  onReply,
  onRate,
  onReopen,
  onEscalate,
}: {
  capabilities: TicketCapabilities
  tatHours: number | null
  pending: { reply: boolean; rate: boolean; reopen: boolean; escalate: boolean }
  onReply: (message: string) => void
  onRate: (rating: TicketRating) => void
  onReopen: () => void
  onEscalate: () => void
}) {
  const [draft, setDraft] = useState('')

  // Live conversation → reply composer.
  if (capabilities.canReply) {
    const send = () => {
      const text = draft.trim()
      if (!text || pending.reply) return
      onReply(text)
      setDraft('')
    }
    return (
      <div className="space-y-1.5">
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/30">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a reply…"
            rows={1}
            className="max-h-32 min-h-10 flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send()
            }}
          />
          <Button
            size="icon"
            onClick={send}
            disabled={!draft.trim() || pending.reply}
            aria-label="Send reply"
          >
            <PaperPlaneRight className="size-4" weight="fill" />
          </Button>
        </div>
        {tatHours != null && (
          <p className="px-1 text-xs text-muted-foreground">
            Coordinators usually reply within {tatHours} hours.
          </p>
        )}
      </div>
    )
  }

  // Resolved/closed → rating + (conditionally) reopen / escalate.
  if (capabilities.canRate) {
    return (
      <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-foreground">
            Did this resolve your issue?
          </span>
          <div className="flex items-center gap-2">
            <RateButton
              label="Yes"
              icon={<ThumbsUp className="size-4" weight="fill" />}
              variant="positive"
              disabled={pending.rate}
              onClick={() => onRate(5)}
            />
            <RateButton
              label="No"
              icon={<ThumbsDown className="size-4" weight="fill" />}
              variant="negative"
              disabled={pending.rate}
              onClick={() => onRate(1)}
            />
          </div>
        </div>

        {(capabilities.canReopen || capabilities.canEscalate) && (
          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            {capabilities.canReopen && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReopen}
                disabled={pending.reopen}
              >
                <ArrowClockwise className="size-4" />
                Reopen
              </Button>
            )}
            {capabilities.canEscalate && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEscalate}
                disabled={pending.escalate}
              >
                <ArrowBendUpRight className="size-4" />
                Escalate
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }

  return null
}

function RateButton({
  label,
  icon,
  variant,
  disabled,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  variant: 'positive' | 'negative'
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <Pressable
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium',
        variant === 'positive'
          ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
          : 'border-rose-200 text-rose-700 hover:bg-rose-50',
        disabled && 'opacity-50',
      )}
    >
      {icon}
      {label}
    </Pressable>
  )
}
