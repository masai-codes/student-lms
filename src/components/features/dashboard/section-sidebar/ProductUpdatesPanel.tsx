import { CaretRight, SealCheck } from '@phosphor-icons/react'
import { SidebarPanel, SidebarPanelLink } from './SidebarPanel'
import type { ProductUpdate } from '../shared/types'

interface ProductUpdatesPanelProps {
  updates: Array<ProductUpdate>
}

// Sidebar panel highlighting recent LMS product updates.
export function ProductUpdatesPanel({ updates }: ProductUpdatesPanelProps) {
  return (
    <SidebarPanel title="Product Updates" action={<SidebarPanelLink label="View all" />}>
      {updates.length === 0 ? (
        <p className="text-sm text-gray-400">No updates right now.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {updates.map((update) => (
            <ProductUpdateRow key={update.id} update={update} />
          ))}
        </div>
      )}
    </SidebarPanel>
  )
}

function ProductUpdateRow({ update }: { update: ProductUpdate }) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3.5 text-left transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6962AC]"
    >
      <SealCheck size={22} weight="fill" className="shrink-0 text-[#6962AC]" />
      <span className="min-w-0 flex-1 text-sm font-semibold text-gray-900">
        {update.title}
      </span>
      <CaretRight size={16} weight="bold" className="shrink-0 text-gray-400" />
    </button>
  )
}
