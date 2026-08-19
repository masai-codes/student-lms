import { ProfileDetailsTab } from '@/components/features/profile/details/ProfileDetailsTab'
import { AccountActivityTab } from '@/components/features/profile/activity/AccountActivityTab'
import { EmailPreferencesTab } from '@/components/features/profile/email-preferences/EmailPreferencesTab'
import { UndertakingsTab } from '@/components/features/profile/undertakings/UndertakingsTab'
import { CertificatesTab } from '@/components/features/profile/certificates/CertificatesTab'
import { InvoicesTab } from '@/components/features/profile/invoices/InvoicesTab'
import { StudentKitTab } from '@/components/features/profile/student-kit/StudentKitTab'
import type { ProfileTab } from '@/components/features/profile/profileTabsConfig'
import type { ProfileOverview } from '@/server/api/profile/profile.types'

/**
 * Renders the active tab only. Each tab owns its own query, gated on being
 * mounted, so opening the page costs one request rather than eight.
 */
export function ProfileTabContent({
  activeTab,
  profile,
}: {
  activeTab: ProfileTab
  profile: ProfileOverview
}) {
  switch (activeTab) {
    case 'details':
      return <ProfileDetailsTab profile={profile} />
    case 'student-kit':
      return <StudentKitTab />
    case 'undertakings':
      return <UndertakingsTab />
    case 'activity':
      return <AccountActivityTab />
    case 'certificates':
      return <CertificatesTab />
    case 'invoices':
      return <InvoicesTab />
    case 'email-preferences':
      return <EmailPreferencesTab />
  }
}
