import { useQuery } from '@tanstack/react-query'
import { fetchCertificates } from '@/lib/api/profile/profileApi'
import { CertificateCard } from '@/components/certificate-card/CertificateCard'

function CertificateSkeleton() {
  return (
    <div className="rounded-[12px] border border-gray-200 bg-white p-5 flex flex-col gap-3 animate-pulse">
      <div className="h-4 w-48 rounded bg-gray-200" />
      <div className="flex flex-col gap-1.5">
        <div className="h-3 w-36 rounded bg-gray-100" />
        <div className="h-3 w-32 rounded bg-gray-100" />
        <div className="h-3 w-28 rounded bg-gray-100" />
      </div>
      <div className="flex gap-2 pt-1">
        <div className="h-8 w-16 rounded-[8px] bg-gray-200" />
        <div className="h-8 w-20 rounded-[8px] bg-gray-100" />
      </div>
    </div>
  )
}

export function CertificatesTab() {
  const { data: certificates, isLoading } = useQuery({
    queryKey: ['certificates'],
    queryFn: fetchCertificates,
    staleTime: 5 * 60 * 1000,
  })

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Certificates</h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <CertificateSkeleton key={i} />)}
        </div>
      ) : !certificates || certificates.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">No certificates found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certificates.map((cert) => (
            <CertificateCard key={cert.certificateObjectId} certificate={cert} />
          ))}
        </div>
      )}
    </div>
  )
}
