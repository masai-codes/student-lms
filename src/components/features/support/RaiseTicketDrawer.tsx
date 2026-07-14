/**
 * RaiseTicketDrawer — a right-side Sheet that lets students raise a ticket
 * directly from any detail page (lecture / assignment / resource) without
 * leaving the page.
 *
 * Flow:
 *   1. Batch picker (only when the student belongs to multiple batches)
 *   2. Issue picker:
 *        - context pages pass `contextCategory` → flat subcategory list scoped
 *          to that category (faithful to the legacy SubcategoryTicketModal)
 *        - otherwise → full category / subcategory accordion
 *   3. Ticket creation + full conversation
 *
 * The data-fetching body lives in {@link RaiseTicketDrawerBody}, mounted only
 * while the drawer is open, so the support query never runs (and no QueryClient
 * is required) when the CTA is merely on screen but unopened.
 */

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from '@phosphor-icons/react'

import { supportOverviewQuery } from '@/query/support/supportQueries'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { CategoryAccordion } from '@/components/features/support/CategoryAccordion'
import { ContextSubcategoryList } from '@/components/features/support/ContextSubcategoryList'
import { TicketConversationPanel } from '@/components/features/support/TicketConversationPanel'

type Step = 'batches' | 'issue' | 'conversation'

type RaiseTicketDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Page context category (e.g. "lecture") — scopes the subcategory list. */
  contextCategory?: string
}

export function RaiseTicketDrawer({
  open,
  onOpenChange,
  contextCategory,
}: RaiseTicketDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        // Raise above every page-level fixed bar — the mobile tab bar (z-[200])
        // and the assignment detail sticky footer (z-[80]) — so the drawer and
        // its Create Ticket CTA are never hidden behind them.
        className="z-[210] flex w-full flex-col gap-0 p-0 sm:max-w-[480px]"
        overlayClassName="z-[210]"
        showCloseButton={false}
      >
        {open && (
          <RaiseTicketDrawerBody
            contextCategory={contextCategory}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function RaiseTicketDrawerBody({
  contextCategory,
  onClose,
}: {
  contextCategory?: string
  onClose: () => void
}) {
  const [step, setStep] = useState<Step>('issue')
  const [batchId, setBatchId] = useState<string | null>(null)
  const [category, setCategory] = useState<string | undefined>()
  const [subcategory, setSubcategory] = useState<string | undefined>()
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const { data: overview, isLoading } = useQuery(supportOverviewQuery())

  const batches = overview?.batches ?? []
  const effectiveBatchId = batchId ?? (batches.length === 1 ? String(batches[0].id) : null)

  // Single batch → auto-select; multiple → show the picker first.
  useEffect(() => {
    if (batches.length === 1 && !batchId) setBatchId(String(batches[0].id))
    else if (batches.length > 1 && !batchId && step === 'issue') setStep('batches')
  }, [batches, batchId, step])

  const pickSubcategory = (cat: string, sub: string) => {
    setCategory(cat)
    setSubcategory(sub)
    setStep('conversation')
  }

  const resetIssue = () => {
    setStep('issue')
    setCategory(undefined)
    setSubcategory(undefined)
  }

  const handleBack = () => {
    if (step === 'conversation') resetIssue()
    else if (step === 'issue' && batches.length > 1) {
      setStep('batches')
      setBatchId(null)
    } else onClose()
  }

  const title =
    step === 'conversation' ? 'Raise Ticket' : step === 'batches' ? 'Select Batch' : 'Raise a Ticket'

  return (
    <>
      <SheetTitle className="sr-only">{title}</SheetTitle>

      <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 px-4 py-4">
        <button
          aria-label="Back"
          onClick={handleBack}
          className="rounded-lg p-1 transition-colors hover:bg-gray-100"
        >
          <ArrowLeft className="size-4 text-gray-700" />
        </button>
        <h2 className="font-poppins text-[16px] font-semibold text-gray-900">{title}</h2>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {isLoading && (
          <div className="flex flex-1 items-center justify-center">
            <p className="font-poppins text-sm text-gray-500">Loading…</p>
          </div>
        )}

        {!isLoading && step === 'batches' && (
          <div className="space-y-3 overflow-y-auto p-4">
            <p className="font-poppins text-[13px] text-gray-600">Select a batch to continue</p>
            {batches.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  setBatchId(String(b.id))
                  setStep('issue')
                }}
                className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <div className="mb-1 text-xs text-gray-500">Batch</div>
                <div className="truncate text-sm font-semibold text-gray-900">
                  {b.name || `Batch ${b.id}`}
                </div>
              </button>
            ))}
          </div>
        )}

        {!isLoading && step === 'issue' && effectiveBatchId && (
          <div className="flex-1 overflow-y-auto">
            {contextCategory ? (
              <ContextSubcategoryList
                category={contextCategory}
                onSelect={(sub) => pickSubcategory(contextCategory, sub)}
              />
            ) : (
              <CategoryAccordion
                expandedItem={expandedCategory}
                setExpandedItem={setExpandedCategory}
                onSubcategoryClick={pickSubcategory}
                categories={overview?.categories ?? []}
              />
            )}
          </div>
        )}

        {!isLoading && step === 'conversation' && effectiveBatchId && (
          <TicketConversationPanel
            batchId={effectiveBatchId}
            category={category}
            subcategory={subcategory}
            onBack={resetIssue}
          />
        )}
      </div>
    </>
  )
}
