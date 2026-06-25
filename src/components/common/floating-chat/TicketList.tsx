import { cn } from '@/lib/utils'
import type { Ticket, Category, TicketFilter } from './types'

interface TicketListProps {
  tickets: Ticket[]
  categories: Category[]
  filter: TicketFilter
  onFilterChange: (filter: TicketFilter) => void
  onTicketSelect: (ticketId: string) => void
}

export function TicketList({ tickets, categories, filter, onFilterChange, onTicketSelect }: TicketListProps) {
  const filteredTickets = tickets.filter(t => filter === 'all' || t.status === filter)

  return (
    <>
      <div className="flex items-center gap-2 mb-2 shrink-0 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
        {(['all', 'open', 'in_progress', 'resolved'] as TicketFilter[]).map(f => {
          const labels: Record<TicketFilter, string> = {
            all: 'All', open: 'Open', in_progress: 'In progress', resolved: 'Resolved'
          }
          const isActive = filter === f
          return (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={cn(
                "px-[13px] py-[6px] rounded-full text-[12px] font-bold whitespace-nowrap transition-all",
                isActive ? "bg-[#4b4396] text-white shadow-sm" : "bg-[#f1f1f7] text-[#62647d] hover:bg-[#e3e3fb] hover:text-[#4b4396]"
              )}
            >
              {labels[f]}
            </button>
          )
        })}
      </div>

      {filteredTickets.map(t => {
        const cat = categories.find(c => c.id === t.category)
        
        let statusClasses = "bg-[#f0f0fd] text-[#4338ca]"
        let statusLabel = "Open"
        if (t.status === 'in_progress') {
          statusClasses = "bg-[#fef3e2] text-[#b45309]"
          statusLabel = "In progress"
        } else if (t.status === 'resolved') {
          statusClasses = "bg-[#e8f7ee] text-[#15803d]"
          statusLabel = "Resolved"
        }

        const lastMessage = t.messages[t.messages.length - 1]
        const prefix = lastMessage.role === 'agent' ? `${lastMessage.name}: ` : (lastMessage.role === 'user' ? 'You: ' : '')

        return (
          <div key={t.id} onClick={() => onTicketSelect(t.id)} className="p-[13px_12px] border border-[#e9e9f3] rounded-[14px] shrink-0 cursor-pointer transition-colors hover:bg-[#f0f0fd] hover:border-[#e3e3fb]">
            <div className="flex items-center justify-between gap-2 mb-[7px]">
              <div className="flex items-center gap-1.5 text-[#62647d] text-[11.8px] font-bold">
                {cat && <cat.icon className="size-[14px] text-[#4b4396] shrink-0" />}
                <span>{t.itemTitle ? cat?.label : 'General Query'}</span>
              </div>
              <span className={cn("text-[11px] font-bold px-[9px] py-[3px] rounded-full shrink-0 whitespace-nowrap", statusClasses)}>
                {statusLabel}
              </span>
            </div>
            <div className="text-[13.8px] font-bold text-[#15162c] mb-1 truncate">
              {t.itemTitle || 'General Query'}
            </div>
            <div className="text-[12.4px] text-[#62647d] mb-[7px] truncate">
              {prefix}{lastMessage.text}
            </div>
            <div className="text-[11.2px] text-[#9496ab]">
              {t.id} · updated {t.updated}
            </div>
          </div>
        )
      })}
    </>
  )
}
