import type { EmailPreferenceKey } from '@/server/api/profile/profile.types'

export interface EmailPreferenceDefinition {
  key: EmailPreferenceKey
  label: string
  description: string
}

/**
 * The six channels the student can control, in display order — same set as the
 * old LMS. The API also stores `messages` and `app_download_reminder`; those are
 * written by other systems and deliberately not exposed here.
 */
export const EMAIL_PREFERENCE_DEFINITIONS: ReadonlyArray<EmailPreferenceDefinition> =
  [
    {
      key: 'lectures',
      label: 'Lectures',
      description: 'Upcoming sessions, schedule changes, and recordings.',
    },
    {
      key: 'assignments',
      label: 'Assignments',
      description: 'New assignments and approaching deadlines.',
    },
    {
      key: 'evaluations',
      label: 'Evaluations',
      description: 'Evaluation invites and published results.',
    },
    {
      key: 'announcements',
      label: 'Announcements',
      description: 'Programme-wide news from your instructors.',
    },
    {
      key: 'tickets',
      label: 'Tickets',
      description: 'Replies and updates on your support tickets.',
    },
    {
      key: 'discussions',
      label: 'Discussions',
      description: 'Replies to your questions and posts.',
    },
  ]
