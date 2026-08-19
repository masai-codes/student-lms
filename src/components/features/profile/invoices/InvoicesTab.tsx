import { FileText, Receipt } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { MasaiButton } from '@/components/ui/masai-button'
import {
  ProfileCardListSkeleton,
  ProfileEmptyState,
  ProfileErrorState,
  ProfileTabPanel,
} from '@/components/features/profile/shared/ProfileStates'
import { profileInvoicesQuery } from '@/query/profile/profileQueries'
import { pushProfileEvent } from '@/components/features/profile/shared/profileAnalytics'

function formatPaidOn(paidOn: string | null): string {
  if (!paidOn) return 'Date unavailable'
  const date = new Date(paidOn)
  if (Number.isNaN(date.getTime())) return paidOn
  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatAmount(amount: number | null): string | null {
  if (amount === null) return null
  return `₹${amount.toLocaleString('en-IN')}`
}

export function InvoicesTab() {
  const {
    data: invoices,
    isLoading,
    isError,
  } = useQuery(profileInvoicesQuery(true))

  return (
    <ProfileTabPanel testId="profile-invoices-panel">
      <h3 className="type-h6 text-foreground">My Invoices</h3>
      <p className="mt-1 type-b2-regular text-foreground-muted">
        Receipts for the fee payments on your enrolment.
      </p>

      <div className="mt-4">
        {isLoading ? (
          <ProfileCardListSkeleton testId="profile-invoices-skeleton" />
        ) : isError ? (
          <ProfileErrorState
            testId="profile-invoices-error"
            message="We couldn't load your invoices. Please refresh and try again."
          />
        ) : (invoices ?? []).length === 0 ? (
          <ProfileEmptyState
            testId="profile-invoices-empty"
            icon={<Receipt size={44} aria-hidden />}
            title="No invoices yet"
            description="Invoices appear here once a fee payment has been processed."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {(invoices ?? []).map((invoice, index) => {
              const amount = formatAmount(invoice.amount)
              return (
                <li
                  key={`${invoice.paymentType}-${invoice.paidOn ?? index}`}
                  data-testid="profile-invoice-item"
                  style={
                    {
                      '--dash-delay': `${Math.min(index, 8) * 0.05}s`,
                    } as React.CSSProperties
                  }
                  className="animate-dash-row-in flex items-center gap-3 rounded-xl border border-border bg-surface p-4"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-foreground-muted">
                    <FileText size={20} aria-hidden />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate type-b2-md text-foreground">
                      {invoice.paymentType}
                    </p>
                    <p className="mt-0.5 type-caption text-foreground-subtle">
                      {formatPaidOn(invoice.paidOn)}
                      {amount ? ` · ${amount}` : ''}
                    </p>
                  </div>

                  {invoice.invoiceUrl ? (
                    <MasaiButton
                      type="secondary"
                      size="sm"
                      ctaText="View"
                      data-testid="profile-invoice-view"
                      className="shrink-0"
                      onClick={() => {
                        pushProfileEvent('invoice_view', {
                          payment_type: invoice.paymentType,
                          paid_on: invoice.paidOn,
                        })
                        window.open(
                          invoice.invoiceUrl as string,
                          '_blank',
                          'noopener,noreferrer',
                        )
                      }}
                    />
                  ) : (
                    <span className="shrink-0 type-caption text-foreground-subtle">
                      Preparing
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </ProfileTabPanel>
  )
}
