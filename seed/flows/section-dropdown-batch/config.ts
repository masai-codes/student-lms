import type { SeedFlowMeta } from '../../types'
import { flowScopedEmail } from '../onboarding-shared/constants'

export const SECTION_DROPDOWN_BATCH_FLOW_ID = 'section-dropdown-batch' as const
export type SectionDropdownBatchFlowId = typeof SECTION_DROPDOWN_BATCH_FLOW_ID

export const sectionDropdownBatchConfig: SeedFlowMeta = {
  id: SECTION_DROPDOWN_BATCH_FLOW_ID,
  description:
    'Batch with `meta.showSectionDropdown = true` and 3 sections, each with a live lecture, a video lecture, and an assignment — exercises the `/learn` section (Course) filter dropdown.',
  timing: {},
  seedCommand: 'npm run seed section-dropdown-batch',
  defaultCredentialEmails: [
    {
      role: 'admin',
      email: flowScopedEmail(SECTION_DROPDOWN_BATCH_FLOW_ID, 'admin'),
    },
    {
      role: 'student',
      email: flowScopedEmail(SECTION_DROPDOWN_BATCH_FLOW_ID, 'student'),
    },
  ],
  primaryLoginRole: 'student',
}
