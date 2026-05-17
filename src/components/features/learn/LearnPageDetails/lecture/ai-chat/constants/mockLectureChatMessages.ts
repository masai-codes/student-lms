export type LectureChatRole = 'user' | 'assistant'

export type LectureChatMessage = {
  id: string
  role: LectureChatRole
  content: string
  createdAtLabel: string
}

export const MOCK_LECTURE_CHAT_HISTORY: Array<LectureChatMessage> = [
  {
    id: 'm1',
    role: 'user',
    content: 'Can you explain the two-pointer approach from this lecture?',
    createdAtLabel: 'Yesterday',
  },
  {
    id: 'm2',
    role: 'assistant',
    content:
      'Two pointers use two indices moving through a sorted array to find pairs or ranges in O(n) time instead of nested loops.',
    createdAtLabel: 'Yesterday',
  },
  {
    id: 'm3',
    role: 'user',
    content: 'What should I practice before the trees lecture?',
    createdAtLabel: '2 days ago',
  },
  {
    id: 'm4',
    role: 'assistant',
    content:
      'Finish the warm-up problems on hash maps and review the sliding-window examples from the supplementary session.',
    createdAtLabel: '2 days ago',
  },
]

export const MOCK_ASSISTANT_REPLY =
  'Here is a quick recap: break the problem into constraints, pick the simplest structure that meets the time target, and explain your trade-offs out loud while you code.'
