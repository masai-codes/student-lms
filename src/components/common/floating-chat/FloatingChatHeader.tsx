import { CaretLeft, X } from '@phosphor-icons/react'
import type { SupportBatch, TicketListItem } from '@/server/api/support/support.types'
import { formatSocialPostTime } from '@/lib/socialRelativeTime'
import type { Category } from './types'
import { ticketStatusLabel } from './ticketStatus'

interface FloatingChatHeaderProps {
  view: 'home' | 'tickets'
  step: number
  selectedTicketId: number | null
  showBatchStep: boolean
  selectedBatch?: SupportBatch
  selectedCategoryObj?: Category
  selectedItemTitle?: string | null
  selectedTicket?: TicketListItem
  onBack: () => void
  onClose?: () => void
}

export function FloatingChatHeader({
  view,
  step,
  selectedTicketId,
  showBatchStep,
  selectedBatch,
  selectedCategoryObj,
  selectedItemTitle,
  selectedTicket,
  onBack,
  onClose,
}: FloatingChatHeaderProps) {
  const getHeaderTitle = () => {
    if (view === 'tickets') {
      if (selectedTicket) return selectedTicket.title
      return 'Your tickets'
    }
    switch (step) {
      case 0:
        return 'Select a batch'
      case 1:
        return 'Choose a category'
      case 2:
        return `Which ${selectedCategoryObj?.label.toLowerCase()}?`
      case 2.5:
        return 'Before you raise a ticket'
      case 2.8:
        return 'Common Questions'
      case 3:
        return 'Describe your issue'
      case 4:
        return 'Select the reason for callback'
      case 5:
        return 'Select preferred time'
      case 6:
        return 'Callback Status'
      default:
        return ''
    }
  }

  const getHeaderSubtitle = () => {
    if (view === 'tickets') {
      if (selectedTicket) {
        const updated = selectedTicket.updatedAt
          ? ` · updated ${formatSocialPostTime(selectedTicket.updatedAt)}`
          : ''
        return `Ticket #${selectedTicket.id} · ${ticketStatusLabel(selectedTicket.status)}${updated}`
      }
      return "Track replies and status on requests you've raised."
    }
    switch (step) {
      case 0:
        return 'Select the batch related to your issue so your ticket reaches the right team.'
      case 1:
        return 'Pick the category that best fits your issue.'
      case 2:
        return 'Select the item related to your request.'
      case 2.5:
        return 'Take a moment to double-check.'
      case 2.8:
        return 'Select an issue for instant resolution.'
      case 3:
        return 'Share the details so we can investigate.'
      case 4:
        return 'Help us route your call to the right expert.'
      case 5:
        return 'When should our team reach out?'
      case 6:
        return 'Review your request status.'
      default:
        return ''
    }
  }

  const showBackButton =
    (view === 'home' && step > 0 && step !== 6 && (step !== 1 || showBatchStep)) ||
    (view === 'tickets' && selectedTicketId != null)

  return (
    <div className="shrink-0 p-[18px_20px_16px] border-b border-[#e9e9f3] bg-white transition-all">
      <div className="flex items-start gap-3">
        {showBackButton && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center shrink-0 size-8 rounded-full bg-[#f1f1f7] text-[#62647d] hover:bg-[#e3e3fb] hover:text-[#4b4396] transition-colors mt-0.5"
          >
            <CaretLeft weight="bold" className="size-4" />
          </button>
        )}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="text-[16.5px] font-bold tracking-[-0.01em] text-[#15162c] truncate pt-[3px]">
            {getHeaderTitle()}
          </div>
          <p className="text-[13px] text-[#62647d] m-0 mt-0.5">{getHeaderSubtitle()}</p>

          {view === 'home' && step === 1 && selectedBatch && (
            <div className="self-start inline-flex items-center gap-1.5 px-[11px] py-[7px] rounded-full bg-[#f0f0fd] text-[#4b4396] text-[12.5px] font-bold border border-[#e3e3fb] mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4b4396]"></span>
              {selectedBatch.name || `Batch ${selectedBatch.id}`}
            </div>
          )}
          {view === 'home' && step === 3 && selectedCategoryObj && (
            <div className="self-start inline-flex items-center max-w-full gap-1.5 px-[11px] py-[7px] rounded-full bg-[#f0f0fd] text-[#4b4396] text-[12.5px] font-bold border border-[#e3e3fb] mt-2">
              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[#4b4396]"></span>
              <span className="truncate">
                {selectedCategoryObj.id === 'general'
                  ? 'General Query'
                  : `${selectedCategoryObj.label}: ${selectedItemTitle}`}
              </span>
            </div>
          )}
          {view === 'tickets' && selectedTicket && (
            <div className="self-start inline-flex items-center max-w-full gap-1.5 px-[11px] py-[7px] rounded-full bg-[#f0f0fd] text-[#4b4396] text-[12.5px] font-bold border border-[#e3e3fb] mt-2 animate-in fade-in slide-in-from-bottom-1 duration-200">
              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[#4b4396]"></span>
              <span className="truncate capitalize">
                {selectedTicket.category.replace(/[-_]/g, ' ')}
              </span>
            </div>
          )}
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close support"
            className="lg:hidden flex items-center justify-center shrink-0 size-8 rounded-full bg-[#f1f1f7] text-[#62647d] hover:bg-[#e3e3fb] hover:text-[#4b4396] transition-colors mt-0.5"
          >
            <X weight="bold" className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  )
}
