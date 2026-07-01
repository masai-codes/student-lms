export interface Category {
  id: string
  label: string
  desc: string
  icon: any
}

export interface Item {
  id?: number
  title: string
  meta: string
  date: string
  type?: 'live' | 'recorded'
  startTime?: string
}

export interface Message {
  role: 'user' | 'bot' | 'agent'
  text: string
  name?: string
}

export type TicketFilter = 'all' | 'open' | 're-opened' | 'resolved'

export interface Ticket {
  id: string
  category: string
  itemTitle: string | null
  status: 'open' | 'in_progress' | 'resolved'
  updated: string
  messages: Message[]
}
