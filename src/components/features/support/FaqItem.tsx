import { useState } from 'react'
import { CaretDown, HandsClapping, ThumbsDown, ThumbsUp } from '@phosphor-icons/react'
import { useMutation } from '@tanstack/react-query'

import type { FaqVote, SupportFaq } from '@/server/api/support/support.types'
import { Pressable } from '@/components/ui/pressable'
import { cn } from '@/lib/utils'
import { SupportMarkdown } from '@/components/features/support/SupportMarkdown'
import { voteSupportFaq } from '@/lib/api/support/supportApi'

/**
 * FaqItem — one expandable FAQ in the accordion.
 *
 * The question is a {@link Pressable} header that expands to reveal the answer
 * (markdown). Inside, the student rates helpfulness — and a 👎 immediately
 * surfaces the "Raise a support ticket" call-to-action, turning a dead-end into
 * an action. Votes are optimistic: the UI updates instantly and the POST runs
 * in the background.
 */
export function FaqItem({
  faq,
  expanded,
  onToggle,
  onRaiseTicket,
}: {
  faq: SupportFaq
  expanded: boolean
  onToggle: () => void
  onRaiseTicket: () => void
}) {
  const [vote, setVote] = useState<FaqVote | null>(null)
  const voteMutation = useMutation({ mutationFn: voteSupportFaq })

  // Booleans (not the narrowed union) so both branches can reference either vote.
  const isUpvote = vote === 'upvote'
  const isDownvote = vote === 'downvote'

  const castVote = (next: FaqVote) => {
    setVote(next) // optimistic — instant feedback
    voteMutation.mutate({ faqId: faq.id, vote: next })
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <Pressable
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="flex-1 font-medium text-foreground">{faq.question}</span>
        <CaretDown
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
            expanded && 'rotate-180',
          )}
        />
      </Pressable>

      {expanded && (
        <div className="space-y-4 border-t border-border px-4 pb-4 pt-3">
          <SupportMarkdown>{faq.answer}</SupportMarkdown>

          {/* Helpfulness + escalation-to-ticket */}
          {isUpvote ? (
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-600">
              <HandsClapping weight="fill" className="size-4" />
              Glad this helped!
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-muted-foreground">Was this helpful?</span>
              <div className="flex items-center gap-1">
                <VoteButton
                  active={false}
                  onClick={() => castVote('upvote')}
                  label="Yes"
                  icon={<ThumbsUp className="size-4" />}
                />
                <VoteButton
                  active={isDownvote}
                  onClick={() => castVote('downvote')}
                  label="No"
                  icon={<ThumbsDown className="size-4" weight={isDownvote ? 'fill' : 'regular'} />}
                />
              </div>
            </div>
          )}

          {isDownvote && (
            <Pressable
              onClick={onRaiseTicket}
              className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Raise a support ticket
            </Pressable>
          )}
        </div>
      )}
    </div>
  )
}

function VoteButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon: React.ReactNode
}) {
  return (
    <Pressable
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-muted-foreground hover:bg-muted',
      )}
    >
      {icon}
      {label}
    </Pressable>
  )
}
