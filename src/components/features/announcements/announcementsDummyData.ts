export interface AnnouncementPageItem {
  id: string
  title: string
  authorName: string
  date: string
  isForYou: boolean
}

export const DUMMY_ANNOUNCEMENTS: Array<AnnouncementPageItem> = [
  {
    id: '1',
    title: 'Welcome to the new semester! Please review the updated course guidelines.',
    authorName: 'Ravi Kumar',
    date: '28 May 2025',
    isForYou: true,
  },
  {
    id: '2',
    title: 'Assignment 3 deadline extended to June 5th.',
    authorName: 'Priya Sharma',
    date: '27 May 2025',
    isForYou: false,
  },
  {
    id: '3',
    title: 'Live session on Data Structures scheduled for tomorrow at 7 PM.',
    authorName: 'Ankit Verma',
    date: '26 May 2025',
    isForYou: true,
  },
  {
    id: '4',
    title: 'New learning resources have been added to the React module.',
    authorName: 'Sneha Patel',
    date: '25 May 2025',
    isForYou: false,
  },
  {
    id: '5',
    title: 'Reminder: Complete your profile to unlock all features.',
    authorName: 'Masai Support',
    date: '24 May 2025',
    isForYou: true,
  },
  {
    id: '6',
    title: 'System maintenance scheduled for Saturday 2–4 AM IST.',
    authorName: 'Tech Team',
    date: '23 May 2025',
    isForYou: false,
  },
  {
    id: '7',
    title: 'Feedback form for Module 4 is now open. Please submit by June 1st.',
    authorName: 'Priya Sharma',
    date: '22 May 2025',
    isForYou: true,
  },
  {
    id: '8',
    title: 'Congratulations to all students who completed the Hackathon last weekend!',
    authorName: 'Ravi Kumar',
    date: '21 May 2025',
    isForYou: false,
  },
  {
    id: '9',
    title: 'Mock interview sessions are open for registration. Sign up today.',
    authorName: 'Career Team',
    date: '20 May 2025',
    isForYou: false,
  },
  {
    id: '10',
    title: 'New community guidelines have been published. Please read them carefully.',
    authorName: 'Admin',
    date: '19 May 2025',
    isForYou: false,
  },
  {
    id: '11',
    title: 'JavaScript advanced workshop recordings are now available in the portal.',
    authorName: 'Ankit Verma',
    date: '18 May 2025',
    isForYou: true,
  },
  {
    id: '12',
    title: 'Public holiday on June 2nd — no live sessions scheduled.',
    authorName: 'Masai Support',
    date: '17 May 2025',
    isForYou: false,
  },
  {
    id: '13',
    title: 'Resume review slots are available. Book yours before they fill up.',
    authorName: 'Career Team',
    date: '16 May 2025',
    isForYou: true,
  },
  {
    id: '14',
    title: 'Node.js project submission portal is now live.',
    authorName: 'Sneha Patel',
    date: '15 May 2025',
    isForYou: false,
  },
  {
    id: '15',
    title: 'Leaderboard updated! Check your rank on the Masaiverse page.',
    authorName: 'Admin',
    date: '14 May 2025',
    isForYou: false,
  },
]
