import { cn } from '@/lib/utils'
import { Headset, MagicWand, Sparkle } from '@phosphor-icons/react'
import { SupportMarkdown } from '@/components/features/support/SupportMarkdown'
import {
  SmartLink,
  ImageThumbnail,
} from '@/components/features/support/AttachmentPreview'
import { formatTicketMessageSentAt } from './formatTicketMessageSentAt'
import type {
  SupportPerson,
  TicketStatus,
} from '@/server/api/support/support.types'
import type { Message, Category } from './types'
import { ENABLE_SUPPORT_AI_REPLY_CARD } from './supportAiFlags'

interface ChatThreadProps {
  messages: Message[]
  isInitialBotGreeting?: boolean
  categoryObj?: Category
  selectedItemTitle?: string | null
  /** The coordinator currently assigned to this ticket (drives the divider below). */
  assignee?: SupportPerson | null
  /** When the ticket was last reopened/escalated — drives a second divider. */
  reopenedAt?: string | null
  ticketStatus?: TicketStatus
}

/** "Chat with {name}" divider shown above a ticket's conversation. */
function AssigneeDivider({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2.5 py-1 px-0.5 animate-in fade-in duration-300">
      <div className="h-px flex-1 bg-[#e9e9f3] dark:bg-border" />
      <span className="shrink-0 rounded-full border border-[#e3e3fb] bg-[#f8f8fc] px-3 py-1 text-[11.5px] font-bold text-[#4b4396] dark:border-border dark:bg-brand-subtle dark:text-brand-subtle-foreground whitespace-nowrap">
        Chat with <span className="font-extrabold">{name}</span>
      </span>
      <div className="h-px flex-1 bg-[#e9e9f3] dark:bg-border" />
    </div>
  )
}

/**
 * Where to insert "Chat with …" dividers in the message list.
 *
 * The reopen/escalate divider marks the boundary between messages that
 * existed *before* the reopen and whatever comes *after* it. When every
 * message currently in the thread already has a timestamp at/after
 * `reopenedAt` (e.g. the student's escalation reason + its auto-reply were
 * just created as part of the reopen itself, with no older messages to
 * separate from), there is nothing to place the divider *before* — so it
 * goes after all current messages instead of above the very first one.
 */
export function assigneeDividerPlacements(
  messages: Message[],
  assigneeName: string | undefined,
  reopenedAt: string | null | undefined,
  ticketStatus: TicketStatus | undefined,
): Map<number, string> {
  const placements = new Map<number, string>()
  if (!assigneeName) return placements

  const firstAgentIdx = messages.findIndex(
    (m) =>
      (m.role === 'agent' && !(ENABLE_SUPPORT_AI_REPLY_CARD && m.isAi)) ||
      m.role === 'bot',
  )
  if (firstAgentIdx >= 0) placements.set(firstAgentIdx, assigneeName)

  if (ticketStatus !== 're-opened') return placements

  let reopenIdx = -1
  if (reopenedAt) {
    reopenIdx = messages.findIndex(
      (m) => m.createdAt != null && m.createdAt >= reopenedAt,
    )
  }

  // Only split before an existing message when older messages actually
  // precede it; otherwise fall through to placing the divider at the end.
  if (reopenIdx > 0) {
    if (reopenIdx !== firstAgentIdx) placements.set(reopenIdx, assigneeName)
  } else {
    placements.set(messages.length, assigneeName)
  }

  return placements
}

function parseMessageContent(text: string) {
  const lines = text.split('\n')
  const attachments: { name: string; url: string; isImage: boolean }[] = []

  let lastTextIndex = -1
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim()
    if (!line) continue

    // Match exactly one link per line
    const linkMatch = line.match(/^(!?)\[([^\]]+)\]\(([^)]+)\)$/)
    if (linkMatch) {
      attachments.unshift({
        isImage: !!linkMatch[1],
        name: linkMatch[2],
        url: linkMatch[3],
      })
    } else {
      lastTextIndex = i
      break
    }
  }

  const cleanText =
    lastTextIndex >= 0
      ? lines
          .slice(0, lastTextIndex + 1)
          .join('\n')
          .trim()
      : ''
  return { cleanText, attachments }
}

export function ChatThread({
  messages,
  isInitialBotGreeting,
  categoryObj,
  selectedItemTitle,
  assignee,
  reopenedAt,
  ticketStatus,
}: ChatThreadProps) {
  const dividerPlacements = assigneeDividerPlacements(
    messages,
    assignee?.name,
    reopenedAt,
    ticketStatus,
  )

  // If this is the initial greeting for step 3
  if (isInitialBotGreeting) {
    return (
      <div className="flex flex-col h-full pb-[6px]">
        <div className="flex gap-[9px] max-w-[92%] animate-in slide-in-from-bottom-2 duration-300 fade-in">
          <div className="flex items-center justify-center shrink-0 size-[26px] rounded-full text-white bg-[#4b4396] dark:bg-brand">
            <Sparkle weight="fill" className="size-[13px]" />
          </div>
          <div className="text-[13.6px] leading-[1.45] p-[10px_13px] rounded-[14px_14px_14px_4px] bg-[#f1f1f7] text-[#15162c] dark:bg-muted dark:text-foreground">
            Hi! I'm here to help
            {categoryObj?.id !== 'general' && selectedItemTitle ? (
              <span>
                {' '}
                with <strong>{selectedItemTitle}</strong>
              </span>
            ) : (
              ''
            )}
            . Go ahead and type out what's going on.
          </div>
        </div>
      </div>
    )
  }

  // Regular ticket messages thread
  return (
    <div className="flex flex-col h-full gap-[12px] pb-[6px]">
      {messages.map((m, i) => {
        const dividerName = dividerPlacements.get(i)
        const isUser = m.role === 'user'
        const isAgent = m.role === 'agent'
        const isAi = ENABLE_SUPPORT_AI_REPLY_CARD && isAgent && m.isAi === true
        const senderLabel = isAi
          ? 'Sahay - AI Resolver Agent'
          : isAgent && m.name
            ? m.name
            : m.isAutoReply
              ? 'Student Experience Team'
              : null
        const { cleanText, attachments } = parseMessageContent(m.text)
        const sentAtLabel = formatTicketMessageSentAt(m.createdAt)

        return (
          <div key={i} className="contents">
            {dividerName ? <AssigneeDivider name={dividerName} /> : null}
            <div
              className={cn(
                'flex gap-[9px] max-w-[92%] animate-in slide-in-from-bottom-2 duration-300 fade-in',
                isUser ? 'self-end flex-row-reverse' : 'self-start',
              )}
            >
              {!isUser && (
                <div
                  className={cn(
                    'flex items-center justify-center shrink-0 size-[26px] rounded-full',
                    isAi
                      ? 'bg-info text-info-foreground'
                      : isAgent
                        ? 'bg-foreground text-background'
                        : 'bg-[#4b4396] text-white dark:bg-brand',
                  )}
                >
                  {isAi ? (
                    <MagicWand weight="fill" className="size-[13px]" />
                  ) : isAgent ? (
                    <Headset weight="fill" className="size-[13px]" />
                  ) : (
                    <Sparkle weight="fill" className="size-[13px]" />
                  )}
                </div>
              )}
              <div
                className={cn(
                  'flex flex-col gap-1 w-full',
                  isUser ? 'items-end' : 'items-start',
                )}
              >
                {senderLabel ? (
                  <span className="text-[11px] font-bold text-[#62647d] dark:text-foreground-muted ml-1">
                    {senderLabel}
                  </span>
                ) : null}

                {cleanText && (
                  <div
                    className={cn(
                      'overflow-hidden',
                      isUser
                        ? 'bg-[#4b4396] dark:bg-brand/80 rounded-[14px_14px_4px_14px]'
                        : isAi
                          ? 'bg-info-subtle dark:ring-1 dark:ring-info/35 rounded-[14px_14px_14px_4px]'
                          : 'bg-[#f1f1f7] dark:bg-muted rounded-[14px_14px_14px_4px]',
                    )}
                  >
                    <div className="p-[10px_13px]">
                      <SupportMarkdown
                        variant={isUser ? 'user' : 'agent'}
                        className={cn(
                          'text-[13.6px] leading-[1.45] prose-p:my-0 prose-p:leading-[1.45]',
                          isUser
                            ? 'text-white prose-headings:text-white prose-p:text-white prose-strong:text-white prose-a:text-white'
                            : isAi
                              ? 'text-info-subtle-foreground dark:text-foreground'
                              : 'text-[#15162c] dark:text-foreground',
                        )}
                      >
                        {cleanText}
                      </SupportMarkdown>
                    </div>
                    {isAi ? (
                      <div className="flex items-center border-t border-info/20 bg-info/10 px-[15px] py-[10px] dark:border-info/35 dark:bg-info/20">
                        <span className="text-[10.5px] italic leading-[1.2] text-info-subtle-foreground/80 dark:text-info-subtle-foreground">
                          This is an AI and can make mistakes.
                        </span>
                      </div>
                    ) : null}
                  </div>
                )}

                {attachments.length > 0 && (
                  <div
                    className={cn(
                      'flex flex-col gap-1.5 mt-1',
                      isUser ? 'items-end w-full' : 'items-start w-full',
                    )}
                  >
                    {attachments.map((att, idx) => (
                      <div
                        key={idx}
                        className={
                          isUser
                            ? 'w-full max-w-[280px]'
                            : 'w-full max-w-[280px]'
                        }
                      >
                        {att.isImage ? (
                          <ImageThumbnail
                            src={att.url}
                            alt={att.name}
                            variant="agent"
                          />
                        ) : (
                          <SmartLink
                            href={att.url}
                            name={att.name}
                            variant="agent"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {sentAtLabel ? (
                  <span className="text-[10.5px] text-[#9496ab] dark:text-foreground-subtle px-1">
                    {sentAtLabel}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        )
      })}
      {dividerPlacements.has(messages.length) ? (
        <AssigneeDivider name={dividerPlacements.get(messages.length)!} />
      ) : null}
    </div>
  )
}
