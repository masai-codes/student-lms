import { CaretLeft } from '@phosphor-icons/react'
import type { Course, Category, Ticket } from './types'

interface FloatingChatHeaderProps {
  view: 'home' | 'tickets'
  step: number
  selectedTicketId: string | null
  selectedCourseObj?: Course
  selectedCategoryObj?: Category
  selectedItemTitle?: string | null
  selectedTicketObj?: Ticket
  categories: Category[]
  onBack: () => void
}

export function FloatingChatHeader({
  view,
  step,
  selectedTicketId,
  selectedCourseObj,
  selectedCategoryObj,
  selectedItemTitle,
  selectedTicketObj,
  categories,
  onBack
}: FloatingChatHeaderProps) {
  const getHeaderTitle = () => {
    if (view === 'tickets') {
      if (selectedTicketObj) {
        const cat = categories.find(c => c.id === selectedTicketObj.category)
        return selectedTicketObj.itemTitle ? cat?.label : 'General Query'
      }
      return "Your tickets"
    }
    switch(step) {
      case 0: return "Select a batch"
      case 1: return "Choose a category"
      case 2: return `Which ${selectedCategoryObj?.label.toLowerCase()}?`
      case 2.5: return "Before you raise a ticket"
      case 3: return "Describe your issue"
      default: return ""
    }
  }

  const getHeaderSubtitle = () => {
    if (view === 'tickets') {
      if (selectedTicketObj) {
        let statusLabel = "Open"
        if (selectedTicketObj.status === 'in_progress') statusLabel = "In progress"
        else if (selectedTicketObj.status === 'resolved') statusLabel = "Resolved"
        return `Ticket ${selectedTicketObj.id} · ${statusLabel} · updated ${selectedTicketObj.updated}`
      }
      return "Track replies and status on requests you've raised."
    }
    switch(step) {
      case 0: return "Select the batch related to your issue so your ticket reaches the right team."
      case 1: return "Pick the category that best fits your issue."
      case 2: return "Select the item related to your request."
      case 2.5: return "Take a moment to double-check."
      case 3: return "Share the details so we can investigate."
      default: return ""
    }
  }

  const showBackButton = (view === 'home' && step > 0) || (view === 'tickets' && selectedTicketId)

  return (
    <div className="shrink-0 p-[18px_20px_16px] border-b border-[#e9e9f3] bg-white transition-all">
      <div className="flex items-start gap-3">
        {showBackButton && (
          <button 
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
          <p className="text-[13px] text-[#62647d] m-0 mt-0.5">
            {getHeaderSubtitle()}
          </p>
          
          {view === 'home' && step === 1 && selectedCourseObj && (
            <div className="self-start inline-flex items-center gap-1.5 px-[11px] py-[7px] rounded-full bg-[#f0f0fd] text-[#4b4396] text-[12.5px] font-bold border border-[#e3e3fb] mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4b4396]"></span>
              {selectedCourseObj.batch}
            </div>
          )}
          {view === 'home' && step === 3 && selectedCategoryObj && (
            <div className="self-start inline-flex items-center max-w-full gap-1.5 px-[11px] py-[7px] rounded-full bg-[#f0f0fd] text-[#4b4396] text-[12.5px] font-bold border border-[#e3e3fb] mt-2">
              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[#4b4396]"></span>
              <span className="truncate">
                {selectedCategoryObj.id === 'general' ? 'General Query' : `${selectedCategoryObj.label}: ${selectedItemTitle}`}
              </span>
            </div>
          )}
          {view === 'tickets' && selectedTicketObj && (() => {
            const cat = categories.find(c => c.id === selectedTicketObj.category)
            return (
              <div className="self-start inline-flex items-center max-w-full gap-1.5 px-[11px] py-[7px] rounded-full bg-[#f0f0fd] text-[#4b4396] text-[12.5px] font-bold border border-[#e3e3fb] mt-2 animate-in fade-in slide-in-from-bottom-1 duration-200">
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[#4b4396]"></span>
                <span className="truncate">
                  {selectedTicketObj.itemTitle ? `${cat?.label}: ${selectedTicketObj.itemTitle}` : 'General Query'}
                </span>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
