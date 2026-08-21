import { Certificate } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { CertificateCard } from '@/components/certificate-card/CertificateCard'
import {
  ProfileCardListSkeleton,
  ProfileEmptyState,
  ProfileErrorState,
  ProfileTabPanel,
} from '@/components/features/profile/shared/ProfileStates'
import { profileCertificatesQuery } from '@/query/profile/profileQueries'

/**
 * All of the student's certificates, across every batch.
 *
 * Reuses the shared `CertificateCard` (view modal, confetti, LinkedIn share)
 * that the course page already uses, so the two surfaces stay identical.
 */
export function CertificatesTab() {
  const {
    data: certificates,
    isLoading,
    isError,
  } = useQuery(profileCertificatesQuery(true))

  return (
    <ProfileTabPanel testId="profile-certificates-panel">
      <h3 className="type-h6 text-foreground">Certificates</h3>
      <p className="mt-1 type-b2-regular text-foreground-muted">
        Everything you&apos;ve earned across your programmes.
      </p>

      <div className="mt-4">
        {isLoading ? (
          <ProfileCardListSkeleton testId="profile-certificates-skeleton" />
        ) : isError ? (
          <ProfileErrorState
            testId="profile-certificates-error"
            message="We couldn't load your certificates. Please refresh and try again."
          />
        ) : (certificates ?? []).length === 0 ? (
          <ProfileEmptyState
            testId="profile-certificates-empty"
            icon={<Certificate size={44} aria-hidden />}
            title="No certificates yet"
            description="Complete a programme or module and your certificate will show up here."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {(certificates ?? []).map((certificate, index) => (
              <div
                key={`${certificate.certificateObjectId}-${index}`}
                data-testid="profile-certificate-item"
                style={
                  {
                    '--dash-delay': `${Math.min(index, 8) * 0.05}s`,
                  } as React.CSSProperties
                }
                className="animate-dash-row-in"
              >
                <CertificateCard certificate={certificate} />
              </div>
            ))}
          </div>
        )}
      </div>
    </ProfileTabPanel>
  )
}
