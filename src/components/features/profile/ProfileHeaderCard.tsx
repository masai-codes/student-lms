import { Link } from '@tanstack/react-router'
import { Envelope, Phone } from '@phosphor-icons/react'
import { ProfileAvatar } from '@/components/features/profile/ProfileAvatar'
import { pushProfileEntityEvent } from '@/components/features/profile/shared/profileAnalytics'
import type { ProfileOverview } from '@/server/api/profile/profile.types'

/** Student codes link to their batch's course page when the batch is known. */
function StudentCodes({ profile }: { profile: ProfileOverview }) {
  if (profile.studentCodes.length === 0) return null

  return (
    <span data-testid="profile-student-codes" className="text-foreground-muted">
      {' ('}
      {profile.studentCodes.map((studentCode, index) => (
        <span key={`${studentCode.code}-${studentCode.batchId ?? 'none'}`}>
          {index > 0 ? ', ' : null}
          {studentCode.batchId ? (
            <Link
              to="/course/$batchId"
              params={{ batchId: String(studentCode.batchId) }}
              title={studentCode.batchName ?? undefined}
              data-testid={`profile-student-code-link-${studentCode.code}`}
              className="text-brand transition-colors hover:underline"
              onClick={() =>
                pushProfileEntityEvent(
                  'click',
                  'student_code',
                  studentCode.batchId as number,
                  { code: studentCode.code },
                )
              }
            >
              {studentCode.code}
            </Link>
          ) : (
            studentCode.code
          )}
        </span>
      ))}
      {')'}
    </span>
  )
}

export function ProfileHeaderCard({ profile }: { profile: ProfileOverview }) {
  return (
    <section
      data-testid="profile-header-card"
      className="animate-dash-rise flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-4 md:flex-row md:items-start md:gap-6 md:p-6"
    >
      <ProfileAvatar name={profile.name} avatarUrl={profile.avatarUrl} />

      <div className="min-w-0 flex-1 text-center md:text-left">
        <h2
          data-testid="profile-header-name"
          className="type-h5 break-words text-foreground"
        >
          {profile.name}
          <StudentCodes profile={profile} />
        </h2>

        <dl className="mt-3 flex flex-col items-center gap-2 md:items-start">
          <div className="flex min-w-0 items-center gap-2">
            <dt className="sr-only">Email</dt>
            <Envelope
              size={16}
              className="shrink-0 text-foreground-subtle"
              aria-hidden
            />
            <dd
              data-testid="profile-header-email"
              className="min-w-0 break-all type-b2-regular text-foreground-muted"
            >
              {profile.email}
            </dd>
          </div>

          {profile.phone ? (
            <div className="flex items-center gap-2">
              <dt className="sr-only">Phone number</dt>
              <Phone
                size={16}
                className="shrink-0 text-foreground-subtle"
                aria-hidden
              />
              <dd
                data-testid="profile-header-phone"
                className="type-b2-regular text-foreground-muted"
              >
                {profile.phone}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
    </section>
  )
}
