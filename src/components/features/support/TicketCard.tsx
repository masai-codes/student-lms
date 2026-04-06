import { FileText } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { TagChip } from '@/components/common'
import type { TicketType } from '@/server/tickets/fetchAllTickets'
import { Card } from '@/components/ui/card'


export function TicketCard({ support }: { support: TicketType }) {

  const navigate = useNavigate()

  const handleClick = () => {

    navigate({
      to: "/support/$supportId",
      params: { supportId: JSON.stringify(support.id) },
    })
  }


  return (
    <div onClick={handleClick} className="block">
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-4">
          {/* Left content */}
          <div className="flex gap-4">
            <div className="mt-1 text-primary">
              <FileText className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-semibold leading-tight">
                {support.title}
              </h3>

              <p className="text-sm text-muted-foreground">
                {support.status} • {support.isClosed}
              </p>
              <p>{JSON.stringify(support.data)}</p>
              <div className="flex gap-2 pt-2">
                <TagChip label={support.priority || "NO DATA FOUND"} />
                <TagChip label={support.category} variant="highlight" />
                <TagChip label="Mandatory" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
