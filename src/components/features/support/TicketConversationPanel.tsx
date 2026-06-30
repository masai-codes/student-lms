/**
 * TicketConversationPanel — prop-driven ticket create/conversation UI.
 *
 * Identical UX to CreateTicketModal but driven by local state (via
 * useTicketComposer) rather than URL params, so it can be embedded in
 * any drawer or container without a router dependency.
 */

import { ArrowLeft, Paperclip } from '@phosphor-icons/react'

import type { TicketMessage } from '@/server/api/support/support.types'
import { MarkdownComposer } from '@/components/ui/markdown-composer'
import { SupportMarkdown } from '@/components/features/support/SupportMarkdown'
import { useTicketComposer } from '@/components/features/support/useTicketComposer'

const slugToLabel = (slug: string) =>
  slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

type TicketConversationPanelProps = {
  batchId: string
  category?: string
  subcategory?: string
  onBack: () => void
}

export function TicketConversationPanel({
  batchId,
  category,
  subcategory,
  onBack,
}: TicketConversationPanelProps) {
  const {
    thread,
    ticket,
    capabilities,
    status,
    message,
    setMessage,
    files,
    setFiles,
    uploading,
    uploadError,
    submitting,
    pendingRating,
    displayedRating,
    scrollRef,
    isExisting,
    handleSubmit,
    handleRating,
    addFiles,
    escalateMutation,
    MAX_FILES,
  } = useTicketComposer({ batchId, category, subcategory })

  const categoryLabel =
    category === 'fallback-no-poc-mapped' ? 'Others' : category ? slugToLabel(category) : 'Support'
  const subcategoryLabel = subcategory ? slugToLabel(subcategory) : ''

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sub-header */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 shrink-0">
        <button
          aria-label="Back"
          onClick={onBack}
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-gray-700" />
        </button>
        <div className="min-w-0">
          <p className="font-poppins font-[500] text-[15px] text-gray-900 truncate">
            {categoryLabel}
            {status && <StatusBadge status={status} />}
          </p>
          {subcategoryLabel && (
            <p className="font-poppins text-[12px] text-gray-500">{subcategoryLabel}</p>
          )}
        </div>
      </div>

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4" ref={scrollRef}>
        <div className="rounded-3xl bg-[#F7F6FF] border border-[#E6E3FF] px-4 py-4 text-[13px] text-gray-700 font-poppins leading-relaxed">
          Share the details of your issue so our support team can reach out with the right help.
        </div>
        {ticket?.message && (
          <MessageBubble isStudent author={ticket.owner.name} message={ticket.message} />
        )}
        {thread?.statusResponse && (
          <MessageBubble
            isStudent={false}
            author="Support Team"
            message={`**${thread.statusResponse.heading}**\n\n${thread.statusResponse.message}`}
          />
        )}
        {thread?.messages.map((m: TicketMessage) => (
          <MessageBubble
            key={m.id}
            isStudent={m.side === 'student'}
            author={m.author.name}
            role={m.author.role}
            message={m.message}
          />
        ))}
      </div>

      {/* Composer (open tickets) */}
      {(!isExisting || capabilities?.canReply) && (
        <div className="border-t border-gray-100 px-4 py-4 shrink-0">
          <MarkdownComposer value={message} onChange={setMessage} rows={3} placeholder="Type your message…" />
          {uploadError && (
            <p className="mt-1 font-poppins text-[12px] text-red-600">{uploadError}</p>
          )}
          {files.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {files.map((f, i) => (
                <span
                  key={`${f.name}-${i}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 font-poppins text-[12px] text-gray-700"
                >
                  <Paperclip className="size-3.5" />
                  <span className="max-w-[120px] truncate">{f.name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${f.name}`}
                    onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))}
                    className="text-gray-400 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 flex items-center justify-between">
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
              className="px-4 py-2.5 bg-[#242C3C] rounded-[12px] text-white font-semibold text-[14px] hover:bg-[#1B2130] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading…' : submitting ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      )}

      {/* Rating + escalate (resolved/closed tickets) */}
      {isExisting && capabilities?.canRate && (
        <div
          className="mx-4 mb-4 rounded-2xl p-4 shrink-0"
          style={{ background: 'linear-gradient(121deg, #EBE9FB 14.37%, #EFE5FF 35.13%, #FCE9EE 63.97%, #EBE9FB 98.71%)' }}
        >
          <p className="text-[13px] font-poppins text-gray-800 text-center mb-2">
            This ticket has been marked as {status}
          </p>
          <div className="bg-white flex p-3 rounded-xl w-full items-center justify-between">
            <span className="text-[13px] font-poppins text-gray-800">Did we solve your issue?</span>
            <div className="flex gap-2">
              <RatingButton selected={displayedRating === 5} loading={pendingRating === 5} onClick={() => handleRating(5)} label="👍" />
              <RatingButton selected={displayedRating === 1} loading={pendingRating === 1} onClick={() => handleRating(1)} label="👎" />
            </div>
          </div>
          {capabilities.canEscalate && (
            <div className="flex justify-end mt-2">
              <button
                className="font-poppins text-[13px] bg-white border border-gray-800 rounded-[10px] px-3 py-2 text-gray-800 font-semibold hover:bg-gray-50 transition disabled:opacity-60"
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
  )
}

function MessageBubble({
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
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isStudent ? 'bg-[#EEF2FF]' : 'bg-gray-50 border border-gray-100'
        }`}
      >
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

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'open' ? 'bg-[#ebf5ff] text-[#8997f8]'
    : status === 'closed' ? 'bg-[#f5fcff] text-[#31afc3]'
    : status === 're-opened' ? 'bg-[#fef8e4] text-[#ffc391]'
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

function RatingButton({
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
      className={`p-2 rounded-full text-lg transition-all hover:bg-gray-100 ${selected ? 'bg-gray-100' : ''} ${loading ? 'cursor-not-allowed opacity-70' : ''}`}
    >
      {label}
    </button>
  )
}
