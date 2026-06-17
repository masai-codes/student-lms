import dayjs from 'dayjs'
import type { CourseResource } from '@/server/api/course/getCourseBatchData.service'
import { FileCard } from './FileCard'

interface Props {
  resources: CourseResource[]
}

export function CourseResources({ resources }: Props) {
  if (resources.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-semibold text-xl leading-8 text-gray-900">Resources</h2>
      <div className="grid grid-cols-2 gap-4">
        {resources.map((r, i) => (
          <FileCard
            key={i}
            title={r.title}
            uploadedOn={r.uploadedOn ? `Uploaded on ${dayjs(r.uploadedOn).format('D MMM YYYY')}` : ''}
            onView={r.url ? () => window.open(r.url!, '_blank') : undefined}
          />
        ))}
      </div>
    </div>
  )
}
