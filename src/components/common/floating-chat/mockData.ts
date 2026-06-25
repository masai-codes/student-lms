import { ChatCircle, PlayCircle, CheckSquareOffset, BookOpen, CheckCircle } from '@phosphor-icons/react'
import type { Course, Category, Item, Ticket } from './types'

export const COURSES: Course[] = [
  {
    id: 'iitrpf-aaih',
    batch: 'IITRPF-AAIH-2604',
    name: 'Certification in Analytics and AI',
    lang: 'Hindi',
  },
  {
    id: 'masai-aiml',
    batch: 'Masai',
    name: 'Artificial Intelligence and Machine Learning',
    lang: null,
  },
  {
    id: 'iitk-dp',
    batch: 'IIT K-DP-HI-III-2604',
    name: 'Data Science & Programming',
    lang: 'Hindi',
  },
]

export const CATEGORIES: Category[] = [
  { id: 'general', label: 'General Query', desc: "Anything that doesn't fit below", icon: ChatCircle },
  { id: 'lecture', label: 'Lecture', desc: 'A doubt about a class or recording', icon: PlayCircle },
  { id: 'assignment', label: 'Assignment', desc: 'Stuck on a problem or submission', icon: CheckSquareOffset },
  { id: 'resource', label: 'Resource', desc: 'Issue with a document or reading', icon: BookOpen },
  { id: 'evaluation', label: 'Evaluation', desc: 'Quiz, test or interview related', icon: CheckCircle },
]

export const ITEMS: Record<string, Item[]> = {
  lecture: [
    { title: 'Lecture 008: Recursion & Backtracking', meta: 'Module 4 · DSA', date: 'Yesterday' },
    { title: 'Lecture 007: Array & String Methods', meta: 'Module 4 · DSA', date: '3 days ago' },
    { title: 'Test lecture 001 (New dashboard)', meta: 'Module 1 · Coding', date: '28 Jun' },
    { title: 'test learn listing', meta: 'Module 4 · Coding', date: '24 Jun' },
    { title: 'Lecture 006: Time & Space Complexity', meta: 'Module 3 · DSA', date: '1 week ago' },
  ],
  assignment: [
    { title: 'Assignment 12: Binary Search Tree', meta: 'Module 4 · DSA', date: 'Due in 2 days' },
    { title: 'Assignment 11: Sorting Algorithms', meta: 'Module 4 · DSA', date: 'Submitted' },
    { title: 'Assignment 10: Linked List Operations', meta: 'Module 3 · DSA', date: 'Submitted' },
    { title: 'Assignment 09: Recursion Practice Set', meta: 'Module 3 · DSA', date: 'Submitted' },
  ],
  resource: [
    { title: 'Big-O Cheat Sheet', meta: 'Module 4 · DSA', date: 'PDF' },
    { title: 'Git & GitHub Handbook', meta: 'Module 1 · Coding', date: 'PDF' },
    { title: 'JS Closures Deep Dive', meta: 'Module 2 · Coding', date: 'Article' },
    { title: 'Interview Prep Playbook', meta: 'Career Prep', date: 'PDF' },
  ],
  evaluation: [
    { title: 'Module 4 Quiz', meta: 'Module 4 · DSA', date: 'Result pending' },
    { title: 'Mock Interview — DSA', meta: 'Module 4 · DSA', date: 'Scheduled' },
    { title: 'Module 3 Coding Test', meta: 'Module 3 · DSA', date: 'Scored 82%' },
  ],
}

export const TICKETS: Ticket[] = [
  {
    id: '#SP-46810', category: 'general', itemTitle: null, status: 'open', updated: 'Just now',
    messages: [
      { role: 'user', text: "I'm not able to see my certificate download option even after completing the course." },
      { role: 'bot', text: "Got it. I've tagged this as General Query and routed it to the right team — they'll reply right here." }
    ]
  },
  {
    id: '#SP-47990', category: 'lecture', itemTitle: 'Lecture 006: Time & Space Complexity', status: 'in_progress', updated: '5 hours ago',
    messages: [
      { role: 'user', text: 'The recording cuts off around the 40 minute mark, right when Big-O for nested loops is being explained.' },
      { role: 'bot', text: "Got it. I've tagged this as Lecture: Lecture 006: Time & Space Complexity and routed it to the right team — they'll reply right here." },
      { role: 'agent', name: 'Divyanshu K.', text: 'Thanks for flagging this — re-uploading the full recording now, should be fixed within the hour.' }
    ]
  },
  {
    id: '#SP-48213', category: 'assignment', itemTitle: 'Assignment 11: Sorting Algorithms', status: 'resolved', updated: '2 days ago',
    messages: [
      { role: 'user', text: 'My submission shows as ungraded even though I submitted before the deadline.' },
      { role: 'bot', text: "Got it. I've tagged this as Assignment: Assignment 11: Sorting Algorithms and routed it to the right team — they'll reply right here." },
      { role: 'agent', name: 'Divyanshu K.', text: "Hey! Checked your submission — grading was delayed on our end. Your score is updated now, sorry for the wait 🙏" }
    ]
  },
]
