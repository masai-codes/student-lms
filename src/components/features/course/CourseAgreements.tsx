import type { CourseAgreementItem } from '@/server/api/course/getCourseAgreements.service'
import { FileCard } from './FileCard'

interface Props {
  agreements: CourseAgreementItem[]
}

export function CourseAgreements({ agreements }: Props) {
  if (agreements.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-semibold text-xl leading-8 text-foreground">
        Agreements
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {agreements.map((ag) => (
          <FileCard
            key={ag.sectionId}
            title="Program Agreement"
            uploadedOn={ag.sectionName}
            onView={
              ag.agreementPdfUrl
                ? () => window.open(ag.agreementPdfUrl!, '_blank')
                : undefined
            }
            badge={ag.alreadyAccepted ? 'signed' : 'pending'}
          />
        ))}
      </div>
    </div>
  )
}
