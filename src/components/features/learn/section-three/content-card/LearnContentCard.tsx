import { BookOpen, ClipboardList, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { LearnContentItem } from '../../shared/types'

const attendanceStatusClassName: Record<LearnContentItem['attendanceStatus'], string> = {
  Present: 'bg-emerald-100 text-emerald-700',
  Absent: 'bg-rose-100 text-rose-700',
  Pending: 'bg-amber-100 text-amber-700',
}

function LearnTypeIcon({ type }: Pick<LearnContentItem, 'type'>) {
  if (type === 'lecture') {
    return <BookOpen className="size-5 text-primary" />
  }
  if (type === 'assignment') {
    return <ClipboardList className="size-5 text-primary" />
  }
  return <FileText className="size-5 text-primary" />
}

export function LearnContentCard({ item }: { item: LearnContentItem }) {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <LearnTypeIcon type={item.type} />
          </div>
          <div className="space-y-2">
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-muted-foreground">
              {item.hostName} | {item.date}
            </p>
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <Badge className={attendanceStatusClassName[item.attendanceStatus]}>
          {item.attendanceStatus}
        </Badge>
      </div>
    </Card>
  )
}
