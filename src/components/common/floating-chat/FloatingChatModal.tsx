import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CaretRight, House, Ticket } from '@phosphor-icons/react'

import { COURSES, CATEGORIES, ITEMS, TICKETS } from './mockData'
import type { TicketFilter } from './types'

import { FloatingChatHeader } from './FloatingChatHeader'
import { CourseSelector } from './CourseSelector'
import { CategorySelector } from './CategorySelector'
import { ItemSelector } from './ItemSelector'
import { ItemConfirmation } from './ItemConfirmation'
import { ChatThread } from './ChatThread'
import { TicketList } from './TicketList'
import { ChatComposer } from './ChatComposer'

interface FloatingChatModalProps {
  isOpen: boolean
}

export function FloatingChatModal({ isOpen }: FloatingChatModalProps) {
  // Navigation State
  const [view, setView] = useState<'home' | 'tickets'>('home')
  const [step, setStep] = useState(0)

  // Selection State
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedItemTitle, setSelectedItemTitle] = useState<string | null>(null)
  
  // Ticket View State
  const [ticketFilter, setTicketFilter] = useState<TicketFilter>('all')
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  
  // Composer State
  const [message, setMessage] = useState('')

  // Derived Objects
  const selectedCourseObj = COURSES.find(c => c.id === selectedCourse)
  const selectedCategoryObj = CATEGORIES.find(c => c.id === selectedCategory)
  const selectedItemObj = selectedCategory && ITEMS[selectedCategory]?.find(i => i.title === selectedItemTitle)
  const selectedTicketObj = TICKETS.find(t => t.id === selectedTicketId)

  // Styling
  const gradientBg = 'linear-gradient(90.38deg, rgb(75, 67, 150) 2.62%, rgb(105, 98, 172) 100%)'

  const handleBack = () => {
    if (view === 'tickets') {
      if (selectedTicketId) setSelectedTicketId(null)
      return
    }
    if (step === 3) {
      if (selectedCategory === 'general') setStep(1)
      else setStep(2.5)
    }
    else if (step === 2.5) setStep(2)
    else if (step === 2) setStep(1)
    else if (step === 1) setStep(0)
  }

  const handleSwitchTab = (newView: 'home' | 'tickets') => {
    setView(newView)
    if (newView === 'tickets') {
      setSelectedTicketId(null)
    }
  }

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
    if (categoryId === 'general') {
      setStep(3)
    } else {
      setStep(2)
    }
  }

  const unreadTicketsCount = TICKETS.filter(t => t.status !== 'resolved').length

  return (
    <div
      className={cn(
        "fixed bottom-24 right-6 w-[392px] h-[650px] max-h-[680px] bg-white rounded-[22px] flex flex-col overflow-hidden z-[50] transition-all duration-300 ease-out origin-bottom-right shadow-[0_24px_60px_-12px_rgba(20,20,43,0.30)] border border-[#e9e9f3]",
        isOpen ? "scale-100 translate-y-0 opacity-100 pointer-events-auto" : "scale-90 translate-y-4 opacity-0 pointer-events-none"
      )}
    >
      <FloatingChatHeader
        view={view}
        step={step}
        selectedTicketId={selectedTicketId}
        selectedCourseObj={selectedCourseObj}
        selectedCategoryObj={selectedCategoryObj}
        selectedItemTitle={selectedItemTitle}
        selectedTicketObj={selectedTicketObj}
        categories={CATEGORIES}
        onBack={handleBack}
      />

      <div className="flex-1 overflow-hidden flex flex-col p-[16px_18px_18px] gap-2.5">
        <div className="flex-1 overflow-y-auto flex flex-col gap-[9px] animate-in slide-in-from-right-2 duration-200 fade-in h-full [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#e9e9f3] [&::-webkit-scrollbar-thumb]:rounded-full pr-1 -mr-1" key={`${view}-${step}-${selectedTicketId}`}>
          
          {view === 'home' && step === 0 && (
            <CourseSelector courses={COURSES} selectedCourse={selectedCourse} onSelect={setSelectedCourse} />
          )}

          {view === 'home' && step === 1 && (
            <CategorySelector categories={CATEGORIES} onSelect={handleCategorySelect} />
          )}

          {view === 'home' && step === 2 && selectedCategoryObj && (
            <ItemSelector
              categoryObj={selectedCategoryObj}
              items={ITEMS[selectedCategoryObj.id] || []}
              onSelect={(title) => {
                setSelectedItemTitle(title)
                setStep(2.5)
              }}
            />
          )}

          {view === 'home' && step === 2.5 && selectedCategoryObj && selectedItemObj && (
            <ItemConfirmation
              categoryObj={selectedCategoryObj}
              itemObj={selectedItemObj}
              onConfirm={() => setStep(3)}
            />
          )}

          {view === 'home' && step === 3 && (
            <ChatThread isInitialBotGreeting categoryObj={selectedCategoryObj} selectedItemTitle={selectedItemTitle} messages={[]} />
          )}

          {view === 'tickets' && !selectedTicketId && (
            <TicketList
              tickets={TICKETS}
              categories={CATEGORIES}
              filter={ticketFilter}
              onFilterChange={setTicketFilter}
              onTicketSelect={setSelectedTicketId}
            />
          )}

          {view === 'tickets' && selectedTicketId && selectedTicketObj && (
            <ChatThread messages={selectedTicketObj.messages} />
          )}
        </div>
      </div>

      {view === 'home' && step === 0 && (
        <div className={cn(
          "shrink-0 p-[12px_18px_14px] border-t border-[#e9e9f3] bg-white transition-all duration-200 ease-out",
          selectedCourse ? "block" : "hidden"
        )}>
          <button 
            onClick={() => setStep(1)}
            className="flex w-full items-center justify-center gap-2 p-[13px] rounded-[10px] font-bold text-[14px] text-white transition-all hover:-translate-y-[1px] hover:opacity-90 active:scale-[0.98]"
            style={{ background: gradientBg }}
          >
            Continue
            <CaretRight weight="bold" className="size-[15px]" />
          </button>
        </div>
      )}

      {((view === 'home' && step === 3) || (view === 'tickets' && selectedTicketId)) && (
        <ChatComposer
          message={message}
          onChange={setMessage}
          placeholder={view === 'tickets' ? "Reply to this ticket..." : "Describe your issue..."}
        />
      )}

      {/* Bottom Nav */}
      <div className="flex shrink-0 border-t border-[#e9e9f3] bg-white z-10 relative">
        <button 
          onClick={() => handleSwitchTab('home')}
          className={cn(
            "flex-1 flex flex-col items-center gap-[3px] p-[9px_0_10px] text-[10.8px] font-bold transition-colors group",
            view === 'home' ? "text-[#4b4396]" : "text-[#9496ab] hover:text-[#4b4396]"
          )}
        >
          <House weight="bold" className="size-[19px]" />
          <span>Home</span>
        </button>
        <button 
          onClick={() => handleSwitchTab('tickets')}
          className={cn(
            "relative flex-1 flex flex-col items-center gap-[3px] p-[9px_0_10px] text-[10.8px] font-bold transition-colors group",
            view === 'tickets' ? "text-[#4b4396]" : "text-[#9496ab] hover:text-[#4b4396]"
          )}
        >
          <Ticket weight="bold" className="size-[19px]" />
          <span>My Tickets</span>
          {unreadTicketsCount > 0 && (
            <span className="absolute top-1 right-[calc(50%-20px)] flex items-center justify-center min-w-[15px] h-[15px] rounded-full bg-[#e1473d] text-white text-[9.5px] font-extrabold px-[3px]">
              {unreadTicketsCount}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
