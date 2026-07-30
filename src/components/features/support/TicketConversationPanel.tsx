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
  slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

type TicketConversationPanelProps = {
  batchId: string
  category?: string
  subcategory?: string
  /** Lecture / assignment / resource the ticket is raised from, if any. */
  entityId?: number | null
  onBack: () => void
}

export function TicketConversationPanel({
  batchId,
  category,
  subcategory,
  entityId,
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
  } = useTicketComposer({ batchId, category, subcategory, entityId })

  const categoryLabel =
    category === 'fallback-no-poc-mapped'
      ? 'Others'
      : category
        ? slugToLabel(category)
        : 'Support'
  const subcategoryLabel = subcategory ? slugToLabel(subcategory) : ''

  const attachments =
    files.length > 0 ? (
      <div className="mt-2 flex flex-wrap gap-2">
        {files.map((f, i) => (
          <span
            key={`${f.name}-${i}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1 font-poppins text-[12px] text-foreground"
          >
            <Paperclip className="size-3.5" />
            <span className="max-w-[120px] truncate">{f.name}</span>
            <button
              type="button"
              aria-label={`Remove ${f.name}`}
              onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))}
              className="text-foreground-subtle hover:text-foreground"
            >
              ✕
            </button>
          </span>
        ))}
      </div>
    ) : null

  const attachButton = (
    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-2 font-poppins text-[13px] text-foreground hover:bg-surface-muted">
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
  )

  // ── Create mode ── mirror the old LMS "Raise a Ticket" modal: the editor sits
  // at the TOP of the body and a full-width "Create Ticket" button in the footer.
  if (!isExisting) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Sub-header */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 shrink-0">
          <button
            aria-label="Back"
            onClick={onBack}
            className="p-1 rounded-lg hover:bg-surface-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <p className="font-poppins font-[700] text-[18px] text-foreground truncate">
            Raise a Ticket
          </p>
        </div>

        {/* Body — top-aligned editor */}
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <button
            type="button"
            onClick={onBack}
            className="w-full flex items-center justify-between rounded-[12px] bg-[#EBF5FF] px-3 py-2 dark:bg-info-subtle"
          >
            <span className="text-[14px] text-foreground font-[500] font-poppins text-left">
              {subcategoryLabel || categoryLabel}
            </span>
            <span className="text-[12px] text-brand font-[500]">Change</span>
          </button>

          <p className="text-[16px] text-foreground mb-3 mt-6 font-poppins">
            Tell us more about your issue
          </p>
          <label className="block text-[14px] font-[500] text-foreground mb-2 font-poppins">
            Describe your issue <span className="text-danger">*</span>
          </label>

          <MarkdownComposer
            value={message}
            onChange={setMessage}
            rows={3}
            placeholder="Type message here"
          />
          {uploadError && (
            <p className="mt-1 font-poppins text-[12px] text-danger">
              {uploadError}
            </p>
          )}
          {attachments}
          <div className="mt-3">{attachButton}</div>
        </div>

        {/* Footer — full-width Create Ticket */}
        <div className="border-t border-border px-4 pb-5 pt-4 shrink-0">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting || (!message.trim() && files.length === 0)}
            className="w-full rounded-[12px] bg-brand py-3.5 text-[16px] text-brand-foreground font-[600] hover:bg-brand transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploading
              ? 'Uploading…'
              : submitting
                ? 'Creating…'
                : 'Create Ticket'}
          </button>
        </div>
      </div>
    )
  }

  // ── Conversation mode (existing ticket) ── chat with the reply composer pinned
  // at the bottom.
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sub-header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 shrink-0">
        <button
          aria-label="Back"
          onClick={onBack}
          className="p-1 rounded-lg hover:bg-surface-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div className="min-w-0">
          <p className="font-poppins font-[500] text-[15px] text-foreground truncate">
            {categoryLabel}
            {status && <StatusBadge status={status} />}
          </p>
          {subcategoryLabel && (
            <p className="font-poppins text-[12px] text-foreground-muted">
              {subcategoryLabel}
            </p>
          )}
        </div>
      </div>

      {/* Conversation */}
      <div
        className="flex-1 overflow-y-auto px-4 py-5 space-y-4"
        ref={scrollRef}
      >
        <div className="rounded-3xl bg-brand-subtle border border-[#E6E3FF] px-4 py-4 text-[13px] text-foreground font-poppins leading-relaxed">
          Share the details of your issue so our support team can reach out with
          the right help.
        </div>
        {ticket?.message && (
          <MessageBubble
            isStudent
            author={ticket.owner.name}
            message={ticket.message}
          />
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
            author={
              m.side === 'system' ? 'Student Experience Team' : m.author.name
            }
            role={m.side === 'system' ? null : m.author.role}
            message={m.message}
          />
        ))}
      </div>

      {/* Composer (reply on open tickets) */}
      {capabilities?.canReply && (
        <div className="border-t border-border px-4 py-4 shrink-0">
          <MarkdownComposer
            value={message}
            onChange={setMessage}
            rows={3}
            placeholder="Type your message…"
          />
          {uploadError && (
            <p className="mt-1 font-poppins text-[12px] text-danger">
              {uploadError}
            </p>
          )}
          {attachments}
          <div className="mt-3 flex items-center justify-between">
            {attachButton}
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
          style={{
            background:
              'linear-gradient(121deg, #EBE9FB 14.37%, #EFE5FF 35.13%, #FCE9EE 63.97%, #EBE9FB 98.71%)',
          }}
        >
          <p className="text-[13px] font-poppins text-foreground text-center mb-2">
            This ticket has been marked as {status}
          </p>
          <div className="bg-surface flex p-3 rounded-xl w-full items-center justify-between">
            <span className="text-[13px] font-poppins text-foreground">
              Did we solve your issue?
            </span>
            <div className="flex gap-2">
              <RatingButton
                selected={displayedRating === 5}
                loading={pendingRating === 5}
                onClick={() => handleRating(5)}
                label="👍"
              />
              <RatingButton
                selected={displayedRating === 1}
                loading={pendingRating === 1}
                onClick={() => handleRating(1)}
                label="👎"
              />
            </div>
          </div>
          {capabilities.canEscalate && (
            <div className="flex justify-end mt-2">
              <button
                className="font-poppins text-[13px] bg-surface border border-gray-800 rounded-[10px] px-3 py-2 text-foreground font-semibold hover:bg-surface-muted transition disabled:opacity-60"
                onClick={() => escalateMutation.mutate()}
                disabled={escalateMutation.isPending}
              >
                {escalateMutation.isPending
                  ? 'Escalating...'
                  : 'Reopen to escalate'}
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
          isStudent
            ? 'bg-brand-subtle'
            : 'bg-surface-muted border border-border'
        }`}
      >
        {!isStudent && (
          <p className="font-poppins text-[12px] font-semibold text-foreground-muted mb-1">
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
    status === 'open'
      ? 'bg-[#ebf5ff] text-[#8997f8] dark:bg-info-subtle dark:text-info-subtle-foreground'
      : status === 'closed'
        ? 'bg-[#f5fcff] text-[#31afc3] dark:bg-info-subtle dark:text-info-subtle-foreground'
        : status === 're-opened'
          ? 'bg-[#fef8e4] text-[#ffc391] dark:bg-warning-subtle dark:text-warning-subtle-foreground'
          : 'bg-[#eefff8] text-success dark:bg-success-subtle dark:text-success-subtle-foreground'
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
      className={`p-2 rounded-full text-lg transition-all hover:bg-surface-muted ${selected ? 'bg-surface-muted' : ''} ${loading ? 'cursor-not-allowed opacity-70' : ''}`}
    >
      {label}
    </button>
  )
}
