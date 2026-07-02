import type { DashboardData } from './types'

// Static placeholder data used to render the dashboard skeleton UI.
// Swap this for API-driven data once the endpoints are wired up.

export const MOCK_DASHBOARD_DATA: DashboardData = {
  studentName: 'Suryakumar',
  profileActionLabel: 'Complete your profile by adding a profile picture',
  welcomeBanners: [
    {
      id: 'banner-referral',
      title: 'Be the friend who brings opportunities, not just memes.',
      subtitle: 'Help a friend start learning and earn rewards',
    },
    {
      id: 'banner-community',
      title: 'Join the conversation in your batch community.',
      subtitle: 'Connect with peers and mentors in real time',
    },
  ],
  pendingTaskCount: 3,
  scheduleWeeks: [
    {
      id: 'week-jan-08',
      label: 'JAN 08-15',
      days: [
        {
          id: 'day-wed-08',
          weekday: 'Wed',
          dayOfMonth: '08',
          isActive: true,
          items: [
            {
              id: 'item-1',
              type: 'lecture',
              title: 'Enhanced Interactive Programming Workshop',
              timeLabel: '10AM - 11:30 AM',
              courseCode: 'IIM-M DM',
              category: 'Tutorial',
              module: 'Module 1',
            },
            {
              id: 'item-2',
              type: 'assignment',
              title: 'Enhanced Interactive Programming Workshop',
              timeLabel: '8 Jan, 11AM - 12 Jan, 11:30 AM',
              courseCode: 'IIM-M DM',
              category: 'Practice',
              module: 'Module 1',
            },
          ],
        },
        {
          id: 'day-tue-09',
          weekday: 'Tue',
          dayOfMonth: '09',
          isActive: false,
          items: [
            {
              id: 'item-3',
              type: 'notes',
              title: 'Enhanced Interactive Programming Workshop',
              timeLabel: '10AM - 11:30 AM',
              courseCode: 'IIM-M DM',
              category: 'Notes',
              module: 'Module 1',
            },
            {
              id: 'item-4',
              type: 'lecture',
              title: 'Enhanced Interactive Programming Workshop',
              timeLabel: '11:30AM - 12:30 PM',
              courseCode: 'IIM-M DM',
              category: 'Tutorial',
              module: 'Module 1',
            },
            {
              id: 'item-5',
              type: 'assignment',
              title: 'Enhanced Interactive Programming Workshop',
              timeLabel: '1PM - 2PM',
              courseCode: 'IIM-M DM',
              category: 'Practice',
              module: 'Module 1',
            },
          ],
        },
      ],
    },
  ],
  announcements: [
    {
      id: 'ann-1',
      title: 'Important Announcements for Students',
      author: 'Prof. Anvesh Jain',
      isForYou: true,
    },
    {
      id: 'ann-2',
      title: 'Important Announcements for Students',
      author: 'Prof. Anvesh Jain',
      isForYou: false,
    },
  ],
  productUpdates: [
    { id: 'pu-1', title: "Discover what's new and improved in the LMS." },
    { id: 'pu-2', title: "Discover what's new and improved in the LMS." },
  ],
}
