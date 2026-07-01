import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { CaretRight, Lifebuoy, Ticket } from '@phosphor-icons/react'
import type { FloatingChatInbox, TicketListItem } from '@/server/api/support/support.types'
import { ticketThreadQuery } from '@/query/support/supportQueries'
import { learnPageQuery } from '@/query/learn/learnQueries'
import { isResolvedTicketStatus } from './ticketStatus'
import {
  mapLearningItemToSupportItem,
  supportCategoryToLearnFilters,
  supportCategoryToLearningType,
  supportCategoryUsesLearnApi,
} from './supportCategoryLearning'

import { CATEGORIES, ITEMS, QUICK_QUERIES } from './mockData'
import type { Item, Message, TicketFilter } from './types'

import { FloatingChatHeader } from './FloatingChatHeader'
import { CourseSelector } from './CourseSelector'
import { CategorySelector } from './CategorySelector'
import { ItemSelector } from './ItemSelector'
import { ItemConfirmation } from './ItemConfirmation'
import { ChatThread } from './ChatThread'
import { TicketList } from './TicketList'
import { ChatComposer } from './ChatComposer'
import { CallbackReasonSelector } from './CallbackReasonSelector'
import { CallbackTimeSelector } from './CallbackTimeSelector'
import { CallbackStatus } from './CallbackStatus'
import { ResolvedTicketFeedback } from './ResolvedTicketFeedback'
import { QuickQuerySelector } from './QuickQuerySelector'
import { uploadSupportAttachment } from '@/lib/api/support/supportApi'
import {
  embedSupportAttachmentLinks,
  SUPPORT_MAX_ATTACHMENTS,
} from './supportAttachmentUpload'

interface FloatingChatModalProps {
  isOpen: boolean
  onClose?: () => void
  inbox?: FloatingChatInbox
  isInboxLoading: boolean
  isInboxError: boolean
  onInboxRetry: () => void
}

const SUPPORT_ITEM_PAGE_SIZE = 10

function filterMockItems(items: Item[], search: string): Item[] {
  const query = search.trim().toLowerCase()
  if (!query) return items
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(query) || item.meta.toLowerCase().includes(query),
  )
}

function threadMessagesToChat(messages: Array<{ message: string; side: string; author: { name: string } }>): Message[] {
  return messages.map((m) => ({
    role: m.side === 'student' ? 'user' : m.side === 'agent' ? 'agent' : 'bot',
    text: m.message,
    name: m.author.name,
  }))
}

export function FloatingChatModal({
  isOpen,
  onClose,
  inbox,
  isInboxLoading,
  isInboxError,
  onInboxRetry,
}: FloatingChatModalProps) {
  const [view, setView] = useState<'home' | 'tickets'>('home')
  const [step, setStep] = useState(0)

  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [itemSearch, setItemSearch] = useState('')
  const [debouncedItemSearch, setDebouncedItemSearch] = useState('')
  const [itemPage, setItemPage] = useState(1)

  const [ticketFilter, setTicketFilter] = useState<TicketFilter>('all')
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)

  const [message, setMessage] = useState('')
  const [files, setFiles] = useState<Array<File>>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [isSubmittingCallback, setIsSubmittingCallback] = useState(false)
  const [callbackStatus, setCallbackStatus] = useState<'success' | 'already_requested'>('success')
  const [isEscalating, setIsEscalating] = useState(false)

  const batches = inbox?.batches ?? []
  const tickets = inbox?.tickets ?? []
  const callbackTickets = inbox?.callbackTickets ?? []
  const openTicketCount = inbox?.openTicketCount ?? 0
  const showBatchStep = batches.length > 1

  useEffect(() => {
    setIsEscalating(false)
  }, [selectedTicketId])

  useEffect(() => {
    if (batches.length !== 1) return
    setSelectedBatchId(batches[0].id)
    setStep((current) => (current === 0 ? 1 : current))
  }, [batches])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedItemSearch(itemSearch), 300)
    return () => clearTimeout(timer)
  }, [itemSearch])

  useEffect(() => {
    setItemPage(1)
  }, [debouncedItemSearch, selectedCategory])

  useEffect(() => {
    if (step === 2) return
    setItemSearch('')
    setDebouncedItemSearch('')
    setItemPage(1)
  }, [step])

  const usesLearnApi = selectedCategory != null && supportCategoryUsesLearnApi(selectedCategory)
  const learningType = selectedCategory ? supportCategoryToLearningType(selectedCategory) : null
  const learnFilters = selectedCategory ? supportCategoryToLearnFilters(selectedCategory) : undefined

  const {
    data: learnPageData,
    isLoading: isLearnItemsLoading,
    isError: isLearnItemsError,
    refetch: refetchLearnItems,
  } = useQuery({
    ...learnPageQuery({
      batchId: selectedBatchId!,
      learningType: learningType!,
      search: debouncedItemSearch.trim() || undefined,
      page: itemPage,
      pageSize: SUPPORT_ITEM_PAGE_SIZE,
      filters: learnFilters,
    }),
    enabled:
      view === 'home' &&
      step === 2 &&
      usesLearnApi &&
      selectedBatchId != null &&
      learningType != null,
  })

  const { data: ticketThread, isLoading: isThreadLoading } = useQuery({
    ...ticketThreadQuery(selectedTicketId ?? 0),
    enabled: view === 'tickets' && selectedTicketId != null,
  })

  const selectedBatch = batches.find((b) => b.id === selectedBatchId)
  const selectedCategoryObj = CATEGORIES.find((c) => c.id === selectedCategory)
  const selectedItemObj = selectedItem
  const selectedTicket: TicketListItem | undefined = tickets.find((t) => t.id === selectedTicketId)
  const threadMessages = ticketThread ? threadMessagesToChat(ticketThread.messages) : []

  const learnItems = useMemo(
    () => (learnPageData?.learningItems ?? []).map(mapLearningItemToSupportItem),
    [learnPageData?.learningItems],
  )
  const mockItems = useMemo(() => {
    if (!selectedCategory) return []
    return filterMockItems(ITEMS[selectedCategory] ?? [], itemSearch)
  }, [selectedCategory, itemSearch])
  const selectorItems = usesLearnApi ? learnItems : mockItems

  const gradientBg = 'linear-gradient(90.38deg, rgb(75, 67, 150) 2.62%, rgb(105, 98, 172) 100%)'

  const goToHomeStart = () => setStep(showBatchStep ? 0 : 1)

  const handleBack = () => {
    if (view === 'tickets') {
      if (selectedTicketId) setSelectedTicketId(null)
      return
    }
    if (step === 6) {
      goToHomeStart()
    } else if (step === 5) {
      setStep(4)
    } else if (step === 4) {
      setStep(1)
    } else if (step === 3) {
      if (selectedCategory === 'general') setStep(1)
      else if (selectedCategory && QUICK_QUERIES[selectedCategory]) setStep(2.8)
      else setStep(2.5)
    } else if (step === 2.8) {
      setStep(2.5)
    } else if (step === 2.5) setStep(2)
    else if (step === 2) setStep(1)
    else if (step === 1 && showBatchStep) setStep(0)
  }

  const handleSwitchTab = (newView: 'home' | 'tickets') => {
    setView(newView)
    if (newView === 'tickets') {
      setSelectedTicketId(null)
    }
  }

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setSelectedItem(null)
    setItemSearch('')
    setDebouncedItemSearch('')
    setItemPage(1)
    if (categoryId === 'general') {
      setStep(3)
    } else {
      setStep(2)
    }
  }

  const addFiles = (incoming: Array<File>) => {
    setUploadError(null)
    setFiles((prev) => [...prev, ...incoming].slice(0, SUPPORT_MAX_ATTACHMENTS))
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleComposerSend = async () => {
    if ((!message.trim() && files.length === 0) || uploading) return
    setUploadError(null)

    let finalMessage = message.trim()
    if (files.length > 0) {
      setUploading(true)
      try {
        const uploaded = await Promise.all(files.map((f) => uploadSupportAttachment(f)))
        finalMessage = embedSupportAttachmentLinks(finalMessage, uploaded)
      } catch {
        setUploading(false)
        setUploadError('Couldn’t upload your attachment. Please try again.')
        return
      }
      setUploading(false)
    }

    setMessage(finalMessage)
    setFiles([])
  }

  const isTicketResolved =
    selectedTicket != null && isResolvedTicketStatus(selectedTicket.status)

  const showInboxLoading = isInboxLoading && !inbox
  const showHomeBatchStep = view === 'home' && step === 0 && showBatchStep

  return (
    <>
      <div
        onClick={onClose}
        className={cn(
          'fixed inset-0 bg-[#15162c]/30 backdrop-blur-[2px] z-[40] transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
      />

      <div
        className={cn(
          'fixed top-4 right-4 bottom-4 w-[512px] bg-white rounded-[22px] flex flex-col overflow-hidden z-[50] transition-transform duration-300 ease-out shadow-[-10px_0_40px_rgba(20,20,43,0.12)] border border-[#e9e9f3]',
          isOpen ? 'translate-x-0' : 'translate-x-[120%]',
        )}
      >
        <FloatingChatHeader
          view={view}
          step={step}
          selectedTicketId={selectedTicketId}
          showBatchStep={showBatchStep}
          selectedBatch={selectedBatch}
          selectedCategoryObj={selectedCategoryObj}
          selectedItemTitle={selectedItem?.title ?? null}
          selectedTicket={selectedTicket}
          onBack={handleBack}
        />

        <div className="flex-1 overflow-hidden flex flex-col p-[16px_18px_8px] gap-2.5">
          <div
            className="flex-1 overflow-y-auto flex flex-col gap-[9px] animate-in slide-in-from-right-2 duration-200 fade-in h-full [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#e9e9f3] [&::-webkit-scrollbar-thumb]:rounded-full pr-1 -mr-1"
            key={`${view}-${step}-${selectedTicketId}`}
          >
            {showHomeBatchStep && showInboxLoading && (
              <div className="flex flex-1 items-center justify-center py-8">
                <p className="text-[13px] text-[#62647d]">Loading batches…</p>
              </div>
            )}

            {showHomeBatchStep && isInboxError && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
                <p className="text-[13px] text-[#62647d]">Couldn&apos;t load your batches.</p>
                <button
                  type="button"
                  onClick={onInboxRetry}
                  className="rounded-[10px] border border-[#e9e9f3] bg-white px-4 py-2 text-[13px] font-bold text-[#15162c] hover:bg-[#f0f0fd]"
                >
                  Try again
                </button>
              </div>
            )}

            {showHomeBatchStep && !showInboxLoading && !isInboxError && batches.length === 0 && (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
                <p className="text-[14px] font-bold text-[#15162c]">No batches found</p>
                <p className="text-[12.5px] text-[#62647d]">
                  We couldn&apos;t find any batch linked to your account.
                </p>
              </div>
            )}

            {showHomeBatchStep && !showInboxLoading && !isInboxError && batches.length > 1 && (
              <CourseSelector
                batches={batches}
                selectedBatchId={selectedBatchId}
                onSelect={setSelectedBatchId}
              />
            )}

            {view === 'home' && step === 1 && showInboxLoading && (
              <div className="flex flex-1 items-center justify-center py-8">
                <p className="text-[13px] text-[#62647d]">Loading…</p>
              </div>
            )}

            {view === 'home' && step === 1 && !showInboxLoading && (
              <CategorySelector
                categories={CATEGORIES}
                onSelect={handleCategorySelect}
                onRequestCallback={() => setStep(4)}
              />
            )}

            {view === 'home' && step === 2 && selectedCategoryObj && (
              <ItemSelector
                categoryObj={selectedCategoryObj}
                items={selectorItems}
                search={itemSearch}
                onSearchChange={setItemSearch}
                isLoading={usesLearnApi ? isLearnItemsLoading : false}
                isError={usesLearnApi ? isLearnItemsError : false}
                onRetry={usesLearnApi ? () => void refetchLearnItems() : undefined}
                pagination={
                  usesLearnApi && learnPageData
                    ? {
                        page: learnPageData.pagination.page,
                        totalPages: learnPageData.pagination.totalPages,
                        hasPreviousPage: learnPageData.pagination.hasPreviousPage,
                        hasNextPage: learnPageData.pagination.hasNextPage,
                        onPageChange: setItemPage,
                      }
                    : undefined
                }
                onSelect={(item) => {
                  setSelectedItem(item)
                  setStep(2.5)
                }}
              />
            )}

            {view === 'home' && step === 2.5 && selectedCategoryObj && selectedItemObj && (
              <ItemConfirmation
                categoryObj={selectedCategoryObj}
                itemObj={selectedItemObj}
                onConfirm={() => {
                  if (QUICK_QUERIES[selectedCategoryObj.id]) {
                    setStep(2.8)
                  } else {
                    setStep(3)
                  }
                }}
                onDirectQuery={(query) => {
                  setMessage(query)
                  setStep(3)
                }}
              />
            )}

            {view === 'home' && step === 2.8 && selectedCategoryObj && QUICK_QUERIES[selectedCategoryObj.id] && (
              <QuickQuerySelector
                queries={QUICK_QUERIES[selectedCategoryObj.id]}
                onSelect={(query) => {
                  setMessage(query)
                  setStep(3)
                }}
              />
            )}

            {view === 'home' && step === 3 && (
              <ChatThread
                isInitialBotGreeting
                categoryObj={selectedCategoryObj}
                selectedItemTitle={selectedItem?.title ?? null}
                messages={[]}
              />
            )}

            {view === 'home' && step === 4 && <CallbackReasonSelector onSelect={() => setStep(5)} />}

            {view === 'home' && step === 5 && (
              <CallbackTimeSelector
                isSubmitting={isSubmittingCallback}
                onSubmit={() => {
                  setIsSubmittingCallback(true)
                  setTimeout(() => {
                    setIsSubmittingCallback(false)
                    setCallbackStatus(Math.random() > 0.5 ? 'success' : 'already_requested')
                    setStep(6)
                  }, 800)
                }}
              />
            )}

            {view === 'home' && step === 6 && (
              <CallbackStatus status={callbackStatus} onClose={goToHomeStart} />
            )}

            {view === 'tickets' && !selectedTicketId && (
              <>
                {showInboxLoading ? (
                  <div className="flex flex-1 items-center justify-center py-8">
                    <p className="text-[13px] text-[#62647d]">Loading tickets…</p>
                  </div>
                ) : isInboxError ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
                    <p className="text-[13px] text-[#62647d]">Couldn&apos;t load your tickets.</p>
                    <button
                      type="button"
                      onClick={onInboxRetry}
                      className="rounded-[10px] border border-[#e9e9f3] bg-white px-4 py-2 text-[13px] font-bold text-[#15162c] hover:bg-[#f0f0fd]"
                    >
                      Try again
                    </button>
                  </div>
                ) : (
                  <TicketList
                    tickets={tickets}
                    callbackTickets={callbackTickets}
                    filter={ticketFilter}
                    onFilterChange={setTicketFilter}
                    onTicketSelect={setSelectedTicketId}
                  />
                )}
              </>
            )}

            {view === 'tickets' && selectedTicketId && (
              <>
                {isThreadLoading && (
                  <div className="flex flex-1 items-center justify-center py-8">
                    <p className="text-[13px] text-[#62647d]">Loading conversation…</p>
                  </div>
                )}
                {!isThreadLoading && threadMessages.length > 0 && (
                  <ChatThread messages={threadMessages} />
                )}
              </>
            )}
          </div>
        </div>

        {showHomeBatchStep && (
          <div
            className={cn(
              'shrink-0 p-[12px_18px_14px] border-t border-[#e9e9f3] bg-white transition-all duration-200 ease-out',
              selectedBatchId ? 'block' : 'hidden',
            )}
          >
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex w-full items-center justify-center gap-2 p-[13px] rounded-[10px] font-bold text-[14px] text-white transition-all hover:-translate-y-[1px] hover:opacity-90 active:scale-[0.98]"
              style={{ background: gradientBg }}
            >
              Continue
              <CaretRight weight="bold" className="size-[15px]" />
            </button>
          </div>
        )}

        {((view === 'home' && step === 3) ||
          (view === 'tickets' && selectedTicketId && (!isTicketResolved || isEscalating))) && (
          <ChatComposer
            message={message}
            onChange={setMessage}
            placeholder={view === 'tickets' ? 'Reply to this ticket...' : 'Describe your issue...'}
            files={files}
            onFilesSelected={addFiles}
            onRemoveFile={removeFile}
            onSend={() => void handleComposerSend()}
            uploading={uploading}
            uploadError={uploadError}
          />
        )}

        {view === 'home' && step === 2.8 && (
          <div className="shrink-0 p-[12px_18px_14px] border-t border-[#e9e9f3] bg-white transition-all duration-200 ease-out">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex w-full items-center justify-center gap-2 p-[13px] rounded-[10px] bg-[#f8f8fc] border-[1.5px] border-[#e9e9f3] text-[#4b4396] font-bold text-[14px] hover:bg-[#f0f0fd] hover:border-[#d6d6f5] transition-all group"
            >
              My issue is not listed
            </button>
          </div>
        )}

        {view === 'tickets' && selectedTicketId && isTicketResolved && !isEscalating && (
          <ResolvedTicketFeedback onEscalate={() => setIsEscalating(true)} onSubmit={() => {}} />
        )}

        <div className="flex shrink-0 border-t border-[#e9e9f3] bg-white z-10 relative">
          <button
            type="button"
            onClick={() => handleSwitchTab('home')}
            className={cn(
              'flex-1 flex flex-col items-center gap-[3px] p-[9px_0_10px] text-[10.8px] font-bold transition-colors group',
              view === 'home' ? 'text-[#4b4396]' : 'text-[#9496ab] hover:text-[#4b4396]',
            )}
          >
            <Lifebuoy weight="bold" className="size-[19px]" />
            <span>Help</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchTab('tickets')}
            className={cn(
              'relative flex-1 flex flex-col items-center gap-[3px] p-[9px_0_10px] text-[10.8px] font-bold transition-colors group',
              view === 'tickets' ? 'text-[#4b4396]' : 'text-[#9496ab] hover:text-[#4b4396]',
            )}
          >
            <Ticket weight="bold" className="size-[19px]" />
            <span>My Tickets</span>
            {openTicketCount > 0 && (
              <span className="absolute top-1 right-[calc(50%-20px)] flex items-center justify-center min-w-[15px] h-[15px] rounded-full bg-[#e1473d] text-white text-[9.5px] font-extrabold px-[3px]">
                {openTicketCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  )
}
