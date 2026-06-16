/**
 * CreateTicketModal — the create + conversation modal.
 *
 * Faithful port of the legacy `experience-ui` modal: a floating bottom-right
 * card on desktop and a full-screen sheet on mobile. Two modes, switched by the
 * `ticketId` search param:
 *   - create  (no ticketId): intro card + composer → creates the ticket.
 *   - details (ticketId set): the full conversation + status-aware footer
 *     (composer while open, 👍/👎 + "Reopen to escalate" once resolved/closed).
 *
 * Data is wired to this repo's backend (one-GET thread + mutations) instead of
 * the legacy GraphQL hooks; compose is text-only for now (attachments TODO).
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Paperclip } from '@phosphor-icons/react'

import type { TicketMessage } from '@/server/api/support/support.types'
import {
  createSupportTicket,
  escalateSupportTicket,
  rateSupportTicket,
  replyToTicket,
  uploadSupportAttachment,
} from '@/lib/api/support/supportApi'
import { SUPPORT_KEYS, ticketThreadQuery } from '@/query/support/supportQueries'
import { MarkdownComposer } from '@/components/ui/markdown-composer'
import { SupportMarkdown } from '@/components/features/support/SupportMarkdown'
import { supportRouteApi } from '@/components/features/support/supportRoute'

const slugToDisplayName = (slug: string): string =>
  slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

type CreateTicketModalProps = {
  category?: string
  subcategory?: string
  onClose: () => void
  onBack: () => void
  batchId: string
}

export function CreateTicketModal({
  category,
  subcategory,
  onClose,
  onBack,
  batchId,
}: CreateTicketModalProps) {
  const navigate = supportRouteApi.useNavigate()
  const search = supportRouteApi.useSearch()
  const queryClient = useQueryClient()

  const ticketId = search.ticketId ?? null
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState<Array<File>>([])
  const [uploading, setUploading] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [pendingRating, setPendingRating] = useState<1 | 5 | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  /** Max attachments per message (matches the legacy limit). */
  const MAX_FILES = 5

  const categoryDisplayName =
    category === 'fallback-no-poc-mapped'
      ? 'Others'
      : category
        ? slugToDisplayName(category)
        : ''
  const subcategoryDisplayName = subcategory ? slugToDisplayName(subcategory) : ''

  useEffect(() => {
    const update = () => setIsDesktop(window.innerWidth >= 1024)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Conversation (details mode).
  const { data: thread } = useQuery({
    ...ticketThreadQuery(ticketId ?? 0),
    enabled: Boolean(ticketId),
  })
  const ticket = thread?.ticket
  const capabilities = thread?.capabilities
  const status = ticket?.status

  const refresh = () => {
    if (ticketId) void queryClient.invalidateQueries({ queryKey: SUPPORT_KEYS.thread(ticketId) })
    void queryClient.invalidateQueries({ queryKey: ['support', 'overview'] })
  }

  const createMutation = useMutation({
    mutationFn: (finalMessage: string) =>
      createSupportTicket({
        batchId: Number(batchId),
        category: category || 'support',
        subCategory: subcategory ?? null,
        message: finalMessage,
      }),
    onSuccess: ({ id }) => {
      setMessage('')
      setFiles([])
      void queryClient.invalidateQueries({ queryKey: ['support', 'overview'] })
      void navigate({ search: (prev) => ({ ...prev, ticketId: id, step: 'ticketdetails' }) })
    },
  })

  const replyMutation = useMutation({
    mutationFn: (finalMessage: string) => replyToTicket({ ticketId: ticketId!, message: finalMessage }),
    onSuccess: () => {
      setMessage('')
      setFiles([])
      refresh()
    },
  })

  const rateMutation = useMutation({
    mutationFn: (rating: 1 | 5) => rateSupportTicket({ ticketId: ticketId!, rating }),
    onSuccess: refresh,
    onSettled: () => setPendingRating(null),
  })

  const escalateMutation = useMutation({
    mutationFn: () => escalateSupportTicket(ticketId!),
    onSuccess: refresh,
  })

  const isExisting = Boolean(ticketId)
  const submitting = createMutation.isPending || replyMutation.isPending || uploading

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return
    setFiles((prev) => [...prev, ...Array.from(incoming)].slice(0, MAX_FILES))
  }

  const handleSubmit = async () => {
    if ((!message.trim() && files.length === 0) || submitting) return

    // Upload attachments first, then embed them as markdown links in the body —
    // exactly how the legacy flow stores attachments.
    let finalMessage = message.trim()
    if (files.length > 0) {
      setUploading(true)
      try {
        const uploaded = await Promise.all(files.map((f) => uploadSupportAttachment(f)))
        const links = uploaded.map((u) => `[${u.name}](${u.url})`).join('\n\n')
        finalMessage = finalMessage ? `${finalMessage}\n\n${links}` : links
      } catch {
        setUploading(false)
        return
      }
      setUploading(false)
    }

    if (isExisting) replyMutation.mutate(finalMessage)
    else createMutation.mutate(finalMessage)
  }

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [])
  useEffect(() => {
    scrollToBottom()
  }, [scrollToBottom, thread?.messages.length, ticket?.message])

  const handleRating = (value: 1 | 5) => {
    if (!ticketId || pendingRating !== null) return
    setPendingRating(value)
    rateMutation.mutate(value)
  }

  const displayedRating =
    pendingRating !== null ? null : ticket?.rating === 1 || ticket?.rating === 5 ? ticket.rating : null

  const wrapperClassName = 'fixed inset-0 z-[9999]'
  const containerClassName = isDesktop
    ? 'absolute bottom-8 right-8 w-[30%] max-w-[450px] min-w-[330px] h-[80vh] max-h-[80vh] bg-white rounded-[24px] shadow-xl flex flex-col overflow-hidden'
    : 'fixed inset-0 bg-white flex flex-col'

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  const content = (
    <div className={wrapperClassName} onClick={handleBackdrop}>
      <div className={containerClassName} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={`flex items-center justify-between border-b border-gray-100 ${isDesktop ? 'px-5 py-4' : 'px-4 py-3'}`}>
          <div className="flex items-center">
            <button aria-label="Back" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex flex-col items-start ml-4">
              <span className="font-poppins font-[500] text-[20px] text-gray-900 truncate">
                {categoryDisplayName}
                {status && <StatusBadge status={status} />}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-poppins font-[400] text-[12px] text-gray-500">{subcategoryDisplayName}</span>
              </div>
            </div>
          </div>
          <button aria-label="Close" className="hover:bg-gray-100 rounded-full transition-colors" onClick={onClose}>
            <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={`flex-1 overflow-y-auto ${isDesktop ? 'px-5 py-6' : 'px-4 py-5'} space-y-4`} ref={scrollRef}>
          <div className="rounded-3xl bg-[#F7F6FF] border border-[#E6E3FF] px-4 py-4 text-[13px] text-gray-700 font-poppins leading-relaxed">
            <p>Share the details of your issue so our support team can reach out with the right help.</p>
          </div>
          {ticket?.message && (
            <ResponseBubble isStudent author={ticket.owner.name} message={ticket.message} />
          )}
          {thread?.statusResponse && (
            <ResponseBubble
              isStudent={false}
              author="Support Team"
              message={`**${thread.statusResponse.heading}**\n\n${thread.statusResponse.message}`}
            />
          )}
          {thread?.messages.map((m: TicketMessage) => (
            <ResponseBubble
              key={m.id}
              isStudent={m.side === 'student'}
              author={m.author.name}
              role={m.author.role}
              message={m.message}
            />
          ))}
        </div>

        {/* Footer: composer (open) or feedback (resolved/closed) */}
        {(!isExisting || capabilities?.canReply) && (
          <div className={`${isDesktop ? 'px-5 py-4' : 'px-4 py-4'}`}>
            <MarkdownComposer
              value={message}
              onChange={setMessage}
              rows={3}
              placeholder="Type your message…"
            />

            {/* Selected attachments */}
            {files.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <span
                    key={`${f.name}-${i}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 font-poppins text-[12px] text-gray-700"
                  >
                    <Paperclip className="size-3.5" />
                    <span className="max-w-[140px] truncate">{f.name}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${f.name}`}
                      onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-gray-400 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 font-poppins text-[13px] text-gray-700 hover:bg-gray-50">
                <Paperclip className="size-4" />
                Attach
                <input
                  type="file"
                  multiple
                  className="hidden"
                  disabled={files.length >= MAX_FILES}
                  onChange={(e) => {
                    addFiles(e.target.files)
                    e.target.value = ''
                  }}
                />
              </label>
              <button
                onClick={() => void handleSubmit()}
                disabled={submitting || (!message.trim() && files.length === 0)}
                className="px-5 py-3 bg-[#242C3C] rounded-[12px] text-white font-semibold text-[14px] hover:bg-[#1B2130] transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading…' : submitting ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        )}

        {isExisting && capabilities?.canRate && (
          <div
            className="mt-2 rounded-2xl p-4"
            style={{
              background:
                'linear-gradient(121deg, #EBE9FB 14.37%, #EFE5FF 35.13%, #FCE9EE 63.97%, #EBE9FB 98.71%)',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            }}
          >
            <p className="text-[14px] font-poppins text-gray-800 mx-auto text-center mb-2">
              This ticket has been marked as {status}
            </p>
            <div className="bg-white flex p-3 rounded-xl w-full items-center justify-between">
              <span className="text-[14px] font-poppins text-gray-800">Did we solve your issue?</span>
              <div className="flex items-center gap-2">
                <ThumbButton
                  selected={displayedRating === 5}
                  loading={pendingRating === 5}
                  onClick={() => handleRating(5)}
                  label="👍"
                />
                <ThumbButton
                  selected={displayedRating === 1}
                  loading={pendingRating === 1}
                  onClick={() => handleRating(1)}
                  label="👎"
                />
              </div>
            </div>
            {capabilities.canEscalate && (
              <div className="flex justify-end gap-2 mt-2">
                <button
                  className="font-poppins text-[14px] bg-white border border-gray-800 rounded-[10px] px-3 py-2 text-gray-800 font-semibold hover:bg-gray-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => escalateMutation.mutate()}
                  disabled={escalateMutation.isPending}
                >
                  {escalateMutation.isPending ? 'Escalating...' : 'Reopen to escalate'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

/** Status pill — same colour map as the legacy modal header. */
function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'open'
      ? 'bg-[#ebf5ff] text-[#8997f8]'
      : status === 'closed'
        ? 'bg-[#f5fcff] text-[#31afc3]'
        : status === 're-opened'
          ? 'bg-[#fef8e4] text-[#ffc391]'
          : 'bg-[#eefff8] text-[#0d930f]'
  return (
    <span
      className={`ml-2 inline-block px-2 py-[2px] rounded-full text-xs font-bold ${cls}`}
      style={{ verticalAlign: 'middle' }}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

/** A single conversation bubble (student right, agent/bot left). */
function ResponseBubble({
  isStudent,
  author,
  role,
  message,
}: {
  isStudent: boolean
  author: string
  role?: string | null
  message: string
}) {
  return (
    <div className={`flex ${isStudent ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${isStudent ? 'bg-[#EEF2FF]' : 'bg-gray-50 border border-gray-100'}`}>
        {!isStudent && (
          <p className="font-poppins text-[12px] font-semibold text-gray-600 mb-1">
            {author}
            {role ? ` · ${role}` : ''}
          </p>
        )}
        <SupportMarkdown className="text-[13px]">{message}</SupportMarkdown>
      </div>
    </div>
  )
}

function ThumbButton({
  selected,
  loading,
  onClick,
  label,
}: {
  selected: boolean
  loading: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`p-2 rounded-full text-lg transition-all hover:bg-gray-100 ${selected ? 'bg-gray-100' : ''} ${
        loading ? 'cursor-not-allowed opacity-70' : ''
      }`}
    >
      {label}
    </button>
  )
}
