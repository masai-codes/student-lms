import dayjs from 'dayjs'
import { CertificateFileCard } from '@/components/certificate-card/CertificateFileCard'
import type { CertificateItem } from '@/server/api/course/getCourseCertificates.service'

interface Props {
  certificates: CertificateItem[]
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  try {
    const d = dayjs(iso)
    return d.isValid() ? `Issued on ${d.format('D MMM YYYY')}` : ''
  } catch {
    return ''
  }
}

export function CourseCertificates({ certificates }: Props) {
  if (certificates.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-semibold text-xl leading-8 text-foreground">
        Certificates
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {certificates.map((cert) => (
          <CertificateFileCard
            key={cert.certificateObjectId}
            certificate={cert}
            subtitle={
              cert.code ?? formatDate(cert.issuedDateIso) ?? cert.batchName
            }
          />
        ))}
      </div>
    </div>
  )
}
