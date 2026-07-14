import dayjs from 'dayjs'
import { useQuery } from '@tanstack/react-query'
import { fetchCertificates } from '@/lib/api/profile/profileApi'
import { CertificateFileCard } from '@/components/certificate-card/CertificateFileCard'

function formatDate(iso: string | null): string {
  if (!iso) return ''
  try {
    const d = dayjs(iso)
    return d.isValid() ? `Issued on ${d.format('D MMM YYYY')}` : ''
  } catch {
    return ''
  }
}

export function CertificatesTab() {
  const { data: certificates, isLoading } = useQuery({
    queryKey: ['certificates'],
    queryFn: fetchCertificates,
    staleTime: 5 * 60 * 1000,
  })

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-bold text-foreground">Certificates</h2>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-surface px-3 animate-pulse"
              style={{ height: 72 }}
            >
              <div className="flex items-center gap-3 h-full">
                <div className="w-12 h-12 rounded-lg bg-muted shrink-0" />
                <div className="flex flex-col gap-2 flex-1">
                  <div className="h-3.5 w-36 rounded bg-muted" />
                  <div className="h-3 w-24 rounded bg-surface-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !certificates || certificates.length === 0 ? (
        <p className="text-sm text-foreground-subtle py-8 text-center">
          No certificates found.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      )}
    </div>
  )
}
