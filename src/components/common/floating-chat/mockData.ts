import { ChatCircle, PlayCircle, CheckSquareOffset, BookOpen, CheckCircle } from '@phosphor-icons/react'
import type { Category, Item, Ticket } from './types'

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
    { title: 'Test lecture 001 (Live)', meta: 'Module 1 · Coding', date: 'Live', type: 'live', startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
    { title: 'test learn listing', meta: 'Module 4 · Coding', date: '24 Jun', type: 'video' },
    { title: 'Lecture 006: Time & Space Complexity', meta: 'Module 3 · DSA', date: '1 week ago' },
  ],
  assignment: [
    { title: 'Assignment 12: Binary Search Tree', meta: 'Module 4 · DSA', date: 'Due in 2 days' },
    { title: 'Assignment 11: Sorting Algorithms', meta: 'Module 4 · DSA', date: 'Submitted' },
    { title: 'Assignment 10: Linked List Operations', meta: 'Module 3 · DSA', date: 'Submitted' },
    { title: 'Assignment 09: Recursion Practice Set', meta: 'Module 3 · DSA', date: 'Submitted' },
  ],
  resource: [
    { title: 'Big-O Cheat Sheet', meta: 'pre-read', date: 'PDF' },
    { title: 'Git & GitHub Handbook', meta: 'notes', date: 'PDF' },
    { title: 'JS Closures Deep Dive', meta: 'reference', date: 'Article' },
    { title: 'Interview Prep Playbook', meta: 'notes', date: 'PDF' },
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

export const QUICK_QUERIES: Record<string, string[]> = {
  lecture: [
    "Unable to join live lecture",
    "Attendance not marked — Live session",
    "Attendance not marked — I watched the full recording but it still shows 'absent'",
    "Attendance not marked — I watched the full recording but it still shows 'Continue Watching'",
    "Need clarification on attendance criteria",
    "What is my total attendance %",
    "Lecture schedule / timing query",
    "Unable to play / view lecture recording",
    "Lecture transcript is unavailable",
    "Lecture notes are unavailable",
    "Lecture notes is different from lecture conducted",
    "Pre-read materials are unavailable",
    "Want to share feedback on lecture/instructor quality",
    "My attendance is not showing correctly in the report",
  ],
  assignment: [
    "Need clarification on instructions",
    "How to submit the assignment",
    "Submitted the assignment but the status is still showing 'Pending'",
    "Facing a technical issue while attempting my assignment",
    "Assignment question(s) different from lecture content",
    "Doubts related to assignment question",
    "Assignment deadline / extension query",
    "Assignment for the lecture/module hasn't been posted yet",
    "My practice assignment not graded",
    "Request for assignment question solutions"
  ],
  evaluation: [
    "Delay in release of evaluation score",
    "Need clarity on evaluation syllabus",
    "Request for reschedule/re-attempt evaluation",
    "Incorrect marks have been given in my evaluation grading",
    "Technical issue during evaluation",
    "Technical issue during proctoring setup",
    "Evaluation question(s) out of syllabus",
    "Missed my evaluation",
    "Missed offline exam",
    "Did not receive admit card for my offline exam",
    "Have a query about my offline exam",
    "Need clarification on my CGPA / grading calculation",
    "Need clarification on exam schedule / weightage",
    "Unable to submit my Capstone project",
    "Clarification on the plagiarism policy",
    "Proctoring compatibility or setup related query",
    "Graded assignment score incorrectly marked",
    "Graded assignment score not visible",
    "Delayed / missed graded assignment submission",
    "Request for deadline extension of graded assignment"
  ],
  resource: [
    "Notes / PPT not shared",
    "Link/content shared during the live class is not available",
    "Unable to open notes / materials",
    "Resource not matching with lecture content",
    "Pre-requisite session's materials not available"
  ]
}
