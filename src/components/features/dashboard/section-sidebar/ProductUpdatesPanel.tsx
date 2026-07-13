import { Link, useNavigate } from '@tanstack/react-router'
import { CaretRight, SealCheck } from '@phosphor-icons/react'
import { pushDashboardEvent } from '../shared/dashboardAnalytics'
import { SidebarPanel, SidebarPanelLink } from './SidebarPanel'
import type { DashboardProductUpdate } from '@/server/api/dashboard/product-updates/getProductUpdates.service'

interface ProductUpdatesPanelProps {
  updates: Array<DashboardProductUpdate>
  isLoading: boolean
  isError: boolean
}

// Global "what's new" feed (newest-first, up to 5). Each row links to the
// update's detail page (firing the `l_whats_new` GTM event); "View All" opens
// the full feed.
export function ProductUpdatesPanel({
  updates,
  isLoading,
  isError,
}: ProductUpdatesPanelProps) {
  const navigate = useNavigate()

  return (
    <SidebarPanel
      title="Product Updates"
      testId="dashboard-product-updates-panel"
      action={
        <SidebarPanelLink
          label="View All"
          testId="dashboard-product-updates-view-all"
          onClick={() => {
            pushDashboardEvent('l_dashboard_product_updates_view_all')
            void navigate({ to: '/whats-new', search: { page: 1 } })
          }}
        />
      }
      isLoading={isLoading}
      isError={isError}
      isEmpty={updates.length === 0}
      emptyText="No content available"
    >
      <div className="flex max-h-72 flex-col gap-3 overflow-y-auto">
        {updates.map((update, index) => (
          <ProductUpdateRow key={update.id} update={update} index={index} />
        ))}
      </div>
    </SidebarPanel>
  )
}

function ProductUpdateRow({
  update,
  index,
}: {
  update: DashboardProductUpdate
  index: number
}) {
  return (
    <Link
      to="/whats-new/$id"
      params={{ id: String(update.id) }}
      onClick={() =>
        pushDashboardEvent('l_dashboard_product_update_click_id_' + update.id, {
          update_id: update.id,
          title: update.title,
        })
      }
      data-testid={`dashboard-product-update-item-${update.id}`}
      style={{ '--dash-delay': `${index * 0.05}s` } as React.CSSProperties}
      className="dash-lift animate-dash-row-in group flex items-center gap-3 rounded-xl border border-gray-200 p-3.5 no-underline hover:border-[#6962AC]/40"
    >
      <SealCheck
        size={22}
        weight="fill"
        className="shrink-0 text-[#6962AC] transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-12"
      />
      <span className="min-w-0 flex-1 text-sm font-semibold text-gray-900">
        {update.title}
      </span>
      <CaretRight
        size={16}
        weight="bold"
        className="shrink-0 text-gray-400 transition-all duration-200 ease-out group-hover:translate-x-1 group-hover:text-[#6962AC]"
      />
    </Link>
  )
}
