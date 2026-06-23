import { ChevronRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export interface ProductUpdateItem {
  id: string
  description: string
  href?: string
}

interface ProductUpdatesPanelProps {
  updates: Array<ProductUpdateItem>
}

export function ProductUpdatesPanel({ updates }: ProductUpdatesPanelProps) {
  return (
    <div className="bg-[#F9FAFB] rounded-xl border border-[#EDEBFE] p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="type-b1-md font-semibold text-gray-900">Product Updates</h3>
        <Link
          to="/whats-new"
          search={{ page: 1 }}
          className="text-sm font-medium text-[#6962AC] hover:underline focus-visible:outline-none"
        >
          View All
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {updates.map((item) => (
          <Link
            key={item.id}
            to="/whats-new/$id"
            params={{ id: item.id }}
            className="rounded-[8px] border border-gray-200 bg-white px-3 py-2.5 flex items-center gap-3 shadow-sm hover:shadow-md hover:border-gray-300 transition-all focus-visible:outline-none"
          >
            <img
              src="/CheckerDashboard.svg"
              alt="Update"
              width={20}
              height={20}
              className="size-5 shrink-0"
              loading="lazy"
              decoding="async"
            />
            <p className="type-b2 text-gray-700 flex-1 min-w-0">{item.description}</p>
            <ChevronRight size={16} className="shrink-0 text-gray-400" />
          </Link>
        ))}

        {updates.length === 0 ? (
          <p className="type-t1 text-gray-400 text-center py-2">No updates yet.</p>
        ) : null}
      </div>
    </div>
  )
}
