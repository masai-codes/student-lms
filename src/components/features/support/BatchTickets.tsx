/**
 * BatchTickets — the `/support` shell. Faithful port of the legacy container.
 *
 * Three tabs (Help / Raised Tickets / 1:1 Support), each reproducing the
 * original flow:
 *   - Help: (multi-batch) batch picker → searchable category accordion →
 *           subcategory opens the create-ticket modal. Plus "Request a Callback".
 *   - Raised Tickets: the listing (see TicketListingPage).
 *   - 1:1 Support: coordinator booking (shown only when available).
 *
 * Everything is driven by URL search params (via {@link supportRouteApi}) and
 * fed by the single aggregated overview query.
 */

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Phone } from '@phosphor-icons/react'

import type { SupportCategory } from '@/server/api/support/support.types'
import { supportOverviewQuery } from '@/query/support/supportQueries'
import { createSupportCallback } from '@/lib/api/support/supportApi'
import { CategoryAccordion } from '@/components/features/support/CategoryAccordion'
import { CreateTicketModal } from '@/components/features/support/CreateTicketModal'
import { PairProgrammingTab } from '@/components/features/support/PairProgrammingTab'
import { TicketListingPage } from '@/components/features/support/TicketListingPage'
import { supportRouteApi } from '@/components/features/support/supportRoute'

export function BatchTickets() {
  const navigate = supportRouteApi.useNavigate()
  const search = supportRouteApi.useSearch()
  const queryClient = useQueryClient()

  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [helpSearchQuery, setHelpSearchQuery] = useState('')

  // The selected batch lives in the URL (?batchId=) so it survives refresh /
  // sharing and every selection is reflected in the address bar.
  const selectedBatchId = search.batchId ? String(search.batchId) : null

  // Callback flow modals
  const [callbackStep, setCallbackStep] = useState<
    'reason' | 'timeslot' | 'success' | null
  >(null)
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [selectedTimeslot, setSelectedTimeslot] = useState<string | null>(null)

  const {
    data: overview,
    isLoading,
    isError,
    refetch,
  } = useQuery(supportOverviewQuery(search.batchId))
  const batches = overview?.batches ?? []

  // No auto-select: the Help tab shows the batch picker by default and a batch
  // is "active" only once chosen (present in the URL as ?batchId).
  const effectiveBatchId = selectedBatchId

  const hasOneOnOne = (overview?.oneOnOne.length ?? 0) > 0
  const activeTab =
    search.tickets === 'ticketlisting'
      ? 'support-tickets'
      : search.tickets === 'pair-programming' && hasOneOnOne
        ? 'pair-programming'
        : 'help'

  const tabs = useMemo(
    () => [
      { label: 'Help', value: 'help' },
      { label: 'Raised Tickets', value: 'support-tickets' },
      ...(hasOneOnOne
        ? [{ label: '1:1 Support', value: 'pair-programming' }]
        : []),
    ],
    [hasOneOnOne],
  )

  const handleTabChange = (value: string) => {
    if (value === 'support-tickets') {
      void navigate({ search: (p) => ({ ...p, tickets: 'ticketlisting' }) })
    } else if (value === 'pair-programming') {
      void navigate({
        search: (p) => ({
          ...p,
          tickets: 'pair-programming',
          step: undefined,
          ticketId: undefined,
          category: undefined,
          subcategory: undefined,
        }),
      })
    } else {
      // Back to Help — keep the selected batch, drop everything else.
      setHelpSearchQuery('')
      void navigate({ search: (p) => ({ batchId: p.batchId }) })
    }
  }

  // Client-side category/subcategory filter (matches legacy search behaviour).
  const visibleCategories = useMemo<Array<SupportCategory>>(() => {
    const cats = overview?.categories ?? []
    const q = helpSearchQuery.trim().toLowerCase()
    if (!q) return cats
    return cats
      .map((c) => {
        if (c.label.toLowerCase().includes(q)) return c
        const subs = c.subcategories.filter((s) =>
          s.label.toLowerCase().includes(q),
        )
        return subs.length ? { ...c, subcategories: subs } : null
      })
      .filter((c): c is SupportCategory => c !== null)
  }, [overview?.categories, helpSearchQuery])

  const openCreate = (categorySlug: string, subcategorySlug: string) => {
    void navigate({
      search: (p) => ({
        ...p,
        category: categorySlug,
        subcategory: subcategorySlug,
        step: 'ticketCreate',
        ticketId: undefined,
      }),
    })
  }

  const closeModal = () =>
    void navigate({
      search: (p) => ({
        ...p,
        step: undefined,
        ticketId: undefined,
        category: undefined,
        subcategory: undefined,
      }),
    })

  // Callback creation
  const callbackMutation = useMutation({
    mutationFn: (timeslot: string) =>
      createSupportCallback({
        batchId: Number(effectiveBatchId ?? batches[0]?.id),
        category: selectedReason!,
        preferredTimeSlot: timeslot,
      }),
    onSuccess: () => {
      setCallbackStep('success')
      void queryClient.invalidateQueries({ queryKey: ['support', 'overview'] })
    },
  })

  const contact = overview?.contact
  const showContact = Boolean(contact?.text || contact?.phone)
  // Legacy gate: the CTA shows only for new-user-journey students with an
  // active batch (NOT merely when reasons exist).
  const showCallbackButton = Boolean(
    effectiveBatchId && overview?.isNewUserJourney,
  )
  // Legacy filter: hide the "Student-Kit" reason unless full fees are paid.
  const callbackReasons = (overview?.callback.reasons ?? []).filter(
    (r) => overview?.hasFullFees || r.value !== 'Student-Kit',
  )
  // The modal stays mounted across create → details (after creating, the step
  // flips to 'ticketdetails' and the same modal shows the new conversation).
  const isTicketModalOpen =
    (search.step === 'ticketCreate' || search.step === 'ticketdetails') &&
    Boolean(effectiveBatchId)

  return (
    <>
      <div className="md:relative mx-auto w-full md:max-w-[1440px]">
        <div className="overflow-hidden">
          {/* Header: tabs + contact + callback button */}
          <div className="flex flex-col sm:flex-row sm:items-stretch sm:justify-between">
            <div className="min-w-0 flex-1 border-b border-border bg-surface-muted">
              <div className="px-4 pt-3 md:px-6 md:pt-4">
                <div className="flex gap-2">
                  {tabs.map((t) => {
                    const active = activeTab === t.value
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => handleTabChange(t.value)}
                        className={`font-poppins rounded-t-lg px-4 py-2.5 text-[14px] font-[500] transition-colors ${
                          active
                            ? 'bg-surface text-brand border border-b-0 border-border'
                            : 'text-foreground-muted hover:text-foreground'
                        }`}
                      >
                        {t.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              {showContact && (
                <div className="border-t border-border px-4 py-3 md:px-6">
                  <p className="font-poppins text-[11px] text-foreground-muted md:text-[13px] md:text-foreground">
                    {contact?.text}
                    {contact?.phone && (
                      <span className="whitespace-nowrap">
                        {contact.text ? ': ' : ''}
                        <a
                          href={`tel:${contact.phone}`}
                          className="font-semibold text-[#2b67d1] hover:underline"
                        >
                          {contact.phone}
                        </a>
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
            {showCallbackButton && (
              <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-muted px-4 py-3 sm:bg-transparent sm:px-0 sm:pb-3 sm:pr-4 sm:pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReason(null)
                    setSelectedTimeslot(null)
                    setCallbackStep('reason')
                  }}
                  className="shrink-0 rounded-lg border border-border-strong bg-surface py-2 px-3 font-poppins text-[12px] font-semibold text-foreground transition-colors hover:bg-surface-muted sm:text-[13px]"
                >
                  <Phone
                    className="mr-1.5 inline-block h-3.5 w-3.5"
                    aria-hidden
                  />
                  Request a Callback
                </button>
              </div>
            )}
          </div>

          {/* Tab body */}
          <div
            className={`relative z-0 min-h-[320px] bg-surface border border-border ${
              activeTab === 'support-tickets'
                ? 'rounded-xl'
                : 'rounded-b-xl rounded-tr-xl sm:rounded-tl-xl'
            }`}
          >
            {activeTab === 'support-tickets' ? (
              <div className="p-4 md:p-6">
                <TicketListingPage
                  batchId={effectiveBatchId ?? String(batches[0]?.id ?? '')}
                />
              </div>
            ) : activeTab === 'pair-programming' ? (
              <div className="p-4 md:p-6">
                <PairProgrammingTab groups={overview?.oneOnOne ?? []} />
              </div>
            ) : (
              <HelpTab
                isLoading={isLoading}
                isError={isError}
                onRetry={() => void refetch()}
                gateReason={overview?.gateReason ?? null}
                batches={batches}
                effectiveBatchId={effectiveBatchId}
                onSelectBatch={(id) => {
                  setHelpSearchQuery('')
                  setExpandedItem(null)
                  // Record the batch in the URL; clear any open modal/search state.
                  void navigate({
                    search: (p) => ({
                      ...p,
                      batchId: Number(id),
                      step: undefined,
                      ticketId: undefined,
                      category: undefined,
                      subcategory: undefined,
                    }),
                  })
                }}
                /* Multi-batch users can return to the batch picker. */
                canChangeBatch={batches.length > 1 && Boolean(selectedBatchId)}
                activeBatchName={
                  batches.find((b) => String(b.id) === effectiveBatchId)
                    ?.name ?? null
                }
                onChangeBatch={() => {
                  setHelpSearchQuery('')
                  setExpandedItem(null)
                  void navigate({
                    search: (p) => ({
                      ...p,
                      batchId: undefined,
                      step: undefined,
                      ticketId: undefined,
                      category: undefined,
                      subcategory: undefined,
                    }),
                  })
                }}
                helpSearchQuery={helpSearchQuery}
                setHelpSearchQuery={setHelpSearchQuery}
                visibleCategories={visibleCategories}
                expandedItem={expandedItem}
                setExpandedItem={setExpandedItem}
                onSubcategoryClick={openCreate}
                onFallbackCreate={() =>
                  openCreate('fallback-no-poc-mapped', 'General')
                }
              />
            )}

            {activeTab === 'help' && isTicketModalOpen && effectiveBatchId && (
              <CreateTicketModal
                category={search.category}
                subcategory={search.subcategory}
                onClose={closeModal}
                onBack={closeModal}
                batchId={effectiveBatchId}
              />
            )}
          </div>
        </div>
      </div>

      {/* Callback modals */}
      {callbackStep && (
        <CallbackFlow
          step={callbackStep}
          reasons={callbackReasons.map((r) => r.value)}
          timeslots={(overview?.callback.timeslots ?? []).map((t) => t.value)}
          selectedTimeslot={selectedTimeslot}
          onClose={() => setCallbackStep(null)}
          onPickReason={(r) => {
            setSelectedReason(r)
            setCallbackStep('timeslot')
          }}
          onPickTimeslot={(t) => {
            setSelectedTimeslot(t)
            callbackMutation.mutate(t)
          }}
        />
      )}
    </>
  )
}

/* ---------------------------- Help tab ---------------------------- */

function HelpTab(props: {
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  gateReason: 'legal-agreement' | 'no-active-section' | null
  batches: Array<{ id: number; name: string }>
  effectiveBatchId: string | null
  onSelectBatch: (id: string) => void
  canChangeBatch: boolean
  activeBatchName: string | null
  onChangeBatch: () => void
  helpSearchQuery: string
  setHelpSearchQuery: (v: string) => void
  visibleCategories: Array<SupportCategory>
  expandedItem: string | null
  setExpandedItem: (v: string | null) => void
  onSubcategoryClick: (c: string, s: string) => void
  onFallbackCreate: () => void
}) {
  const {
    isLoading,
    isError,
    onRetry,
    gateReason,
    batches,
    effectiveBatchId,
    onSelectBatch,
    canChangeBatch,
    activeBatchName,
    onChangeBatch,
    helpSearchQuery,
    setHelpSearchQuery,
    visibleCategories,
    expandedItem,
    setExpandedItem,
    onSubcategoryClick,
    onFallbackCreate,
  } = props

  // Top-level Help states: loading → error → no-batches → batch picker → content.
  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-8">
        <p className="font-poppins text-sm text-foreground-muted">Loading…</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="font-poppins text-sm text-foreground">
          Couldn’t load your support details.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-border-strong bg-surface px-4 py-2 font-poppins text-[13px] font-semibold text-foreground hover:bg-surface-muted"
        >
          Try again
        </button>
      </div>
    )
  }

  if (batches.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="font-poppins text-[15px] font-semibold text-foreground">
          No batches found
        </p>
        <p className="font-poppins text-[13px] text-foreground-muted">
          We couldn’t find any batch linked to your account. If this looks
          wrong, please reach out to your program team.
        </p>
      </div>
    )
  }

  const SearchBar = (
    <div className="border-b border-border bg-surface px-4 py-4 md:px-6 md:py-5">
      <div className="relative">
        <span
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-subtle"
          aria-hidden
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </span>
        <input
          type="search"
          autoComplete="off"
          value={helpSearchQuery}
          onChange={(e) => setHelpSearchQuery(e.target.value)}
          placeholder="Search category and subcategory here"
          className="font-poppins w-full rounded-xl border border-border bg-surface py-3 pl-11 pr-4 text-[14px] text-foreground placeholder:text-foreground-subtle outline-none transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
        />
      </div>
    </div>
  )

  return (
    <>
      {/* Selected-batch bar with a way back to the picker (multi-batch). */}
      {canChangeBatch && effectiveBatchId && (
        <div className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3 md:px-6">
          <p className="font-poppins text-[13px] text-foreground">
            Batch:{' '}
            <span className="font-semibold text-foreground">
              {activeBatchName}
            </span>
          </p>
          <button
            type="button"
            onClick={onChangeBatch}
            className="font-poppins text-[13px] font-semibold text-brand hover:underline"
          >
            Change batch
          </button>
        </div>
      )}

      {gateReason === 'legal-agreement' && (
        <div className="mx-4 mb-4 mt-4 rounded-lg border border-danger bg-danger-subtle p-4 md:mx-6">
          <div className="flex items-center gap-3">
            <div className="text-danger text-lg">⚠️</div>
            <div>
              <h4 className="text-danger font-semibold text-lg">
                Access Restricted
              </h4>
              <p className="text-danger text-sm mt-1">
                Your LMS access has been paused as the Terms &amp; Conditions
                for your program have not yet been accepted. Once you complete
                this step, your access will be restored immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      {gateReason === 'no-active-section' && (
        <div className="mx-4 mb-4 mt-4 rounded-lg border border-warning bg-warning-subtle p-4 md:mx-6">
          <div className="flex items-center gap-3">
            <div className="text-warning text-lg">⚠️</div>
            <div>
              <h4 className="text-warning-subtle-foreground font-semibold text-[15px]">
                No active section yet
              </h4>
              <p className="text-warning-subtle-foreground text-sm mt-1">
                You’ll be able to raise tickets once you’re placed in an active
                section. You can still browse topics below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Batch selection — shown by default until a batch is chosen. */}
      {!effectiveBatchId && (
        <div className="px-4 pt-6 md:px-6">
          <h3 className="mb-3 font-poppins text-[14px] font-semibold text-foreground">
            Select a batch to continue
          </h3>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {batches.map((batch) => (
              <button
                key={batch.id}
                type="button"
                onClick={() => onSelectBatch(String(batch.id))}
                className="w-full rounded-2xl border border-border bg-surface p-4 text-left shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand"
              >
                <div className="text-xs text-foreground-muted mb-1">Batch</div>
                <div className="text-sm font-semibold text-foreground truncate">
                  {batch.name || `Batch ${batch.id}`}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {effectiveBatchId &&
        (visibleCategories.length > 0 ? (
          <div>
            {SearchBar}
            <CategoryAccordion
              expandedItem={expandedItem}
              setExpandedItem={setExpandedItem}
              onSubcategoryClick={onSubcategoryClick}
              categories={visibleCategories}
            />
          </div>
        ) : (
          <>
            {SearchBar}
            {helpSearchQuery.trim() ? (
              <div className="px-4 py-6 text-sm text-foreground-muted md:px-6">
                No matching category or subcategory found.
              </div>
            ) : (
              <div className="mt-6 flex flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-6">
                <p className="text-[11px] md:text-sm text-foreground max-w-2xl leading-relaxed">
                  <span className="font-semibold">
                    Have doubts about your program?
                  </span>{' '}
                  Click on <span className="font-semibold">Create Ticket</span>{' '}
                  and our support team will assist you shortly.
                </p>
                <button
                  type="button"
                  onClick={onFallbackCreate}
                  className="w-full md:w-auto bg-surface text-brand hover:opacity-90 font-semibold rounded-full py-2.5 px-5 shadow-sm border border-brand font-poppins text-[13px] md:text-[14px] whitespace-nowrap"
                >
                  Create Ticket
                </button>
              </div>
            )}
          </>
        ))}
    </>
  )
}

/* ------------------------- Callback flow modals ------------------------- */

function CallbackFlow(props: {
  step: 'reason' | 'timeslot' | 'success'
  reasons: Array<string>
  timeslots: Array<string>
  selectedTimeslot: string | null
  onClose: () => void
  onPickReason: (r: string) => void
  onPickTimeslot: (t: string) => void
}) {
  const {
    step,
    reasons,
    timeslots,
    selectedTimeslot,
    onClose,
    onPickReason,
    onPickTimeslot,
  } = props

  if (step === 'success') {
    return (
      <>
        <div
          className="fixed inset-0 z-[202] bg-black/30"
          aria-hidden
          onClick={onClose}
        />
        <div className="fixed left-1/2 top-1/2 z-[203] w-[90vw] max-w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface p-6 shadow-xl">
          <div className="flex flex-col items-center text-center pt-2 pb-1">
            <div className="w-14 h-14 rounded-full bg-success-subtle border-2 border-success flex items-center justify-center mb-4 text-2xl">
              ✓
            </div>
            <h2 className="text-xl font-bold font-poppins text-foreground mb-3">
              Callback Requested Successfully
            </h2>
            <p className="text-sm font-poppins text-foreground-muted leading-relaxed mb-6 max-w-[320px]">
              {selectedTimeslot
                ? `Our team will reach out to you within 48 hours during ${selectedTimeslot}.`
                : 'Our team will reach out to you within 48 hours.'}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full max-w-[150px] py-2 rounded-lg bg-brand hover:bg-[#5B548F] text-brand-foreground font-poppins font-semibold text-[14px] transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      </>
    )
  }

  const isReason = step === 'reason'
  const options = isReason ? reasons : timeslots
  const title = isReason
    ? 'Select the reason for call back'
    : 'Select a preferred time slot for callback'

  return (
    <>
      <div
        className="fixed inset-0 z-[200] bg-black/20"
        aria-hidden
        onClick={onClose}
      />
      <div className="fixed top-20 right-2 bottom-2 z-[201] w-full max-w-[400px] bg-surface rounded-2xl shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-bold font-poppins text-foreground">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-foreground-muted hover:bg-surface-muted hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {options.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                isReason ? onPickReason(value) : onPickTimeslot(value)
              }
              className="w-full flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3.5 text-left font-poppins text-[14px] font-medium text-foreground hover:bg-surface-muted hover:border-border-strong transition-colors"
            >
              <span>{value}</span>
              <svg
                className="w-5 h-5 text-foreground-subtle shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
