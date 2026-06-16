import type { TicketMessage } from '@/server/api/support/support.types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatSocialPostTime } from '@/lib/socialRelativeTime'
import { cn } from '@/lib/utils'
import { SupportMarkdown } from '@/components/features/support/SupportMarkdown'

/** First-letter initials for the avatar fallback. */
function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
}

/**
 * MessageBubble — one message in the conversation.
 *
 * Chat-style: the student's own messages align right with a filled bubble;
 * coordinators align left with a soft surface and an avatar + role label. System
 * notes (no author) render centered and muted. Body is markdown so embedded
 * attachment links render as links.
 */
export function MessageBubble({ message }: { message: TicketMessage }) {
  if (message.side === 'system') {
    return (
      <p className="mx-auto max-w-md text-center text-xs text-muted-foreground">
        {message.message}
      </p>
    )
  }

  const isStudent = message.side === 'student'

  return (
    <div className={cn('flex gap-2.5', isStudent ? 'flex-row-reverse' : 'flex-row')}>
      {!isStudent && (
        <Avatar className="size-8 shrink-0">
          {message.author.profilePhotoPath && (
            <AvatarImage src={message.author.profilePhotoPath} alt={message.author.name} />
          )}
          <AvatarFallback className="text-xs">{initials(message.author.name)}</AvatarFallback>
        </Avatar>
      )}

      <div className={cn('max-w-[78%] space-y-1', isStudent && 'items-end text-right')}>
        {!isStudent && (
          <p className="px-1 text-xs font-medium text-muted-foreground">
            {message.author.name}
            {message.author.role ? ` · ${message.author.role}` : ''}
          </p>
        )}
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2.5 text-sm',
            isStudent
              ? 'rounded-br-md bg-primary text-primary-foreground'
              : 'rounded-bl-md bg-muted text-foreground',
          )}
        >
          {/* Invert link colour inside the filled student bubble for contrast. */}
          <SupportMarkdown
            className={isStudent ? 'prose-invert prose-a:text-primary-foreground' : undefined}
          >
            {message.message}
          </SupportMarkdown>
        </div>
        {message.createdAt && (
          <p className="px-1 text-[11px] text-muted-foreground">
            {formatSocialPostTime(message.createdAt)}
          </p>
        )}
      </div>
    </div>
  )
}
