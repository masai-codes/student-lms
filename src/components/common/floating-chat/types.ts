export interface Course {
  id: string
  batch: string
  name: string
  lang: string | null
}

export interface Category {
  id: string
  label: string
  desc: string
  icon: any
}

export interface Item {
  title: string
  meta: string
  date: string
}

export interface Message {
  role: 'user' | 'bot' | 'agent'
  text: string
  name?: string
}

export type TicketFilter = 'all' | 'open' | 'in_progress' | 'resolved'

export interface Ticket {
  id: string
  category: string
  itemTitle: string | null
  status: 'open' | 'in_progress' | 'resolved'
  updated: string
  messages: Message[]
}
