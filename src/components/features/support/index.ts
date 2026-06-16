/**
 * Support feature — public component barrel.
 *
 * Import support components from `@/components/features/support`. Routes should
 * only need `SupportHome` (landing) and `TicketConversation` (detail); the rest
 * are composed internally. See `src/server/api/support/START_HERE.md` for the
 * full module tour (DB → service → handler → route → api → query → component).
 */
export { SupportHome } from './SupportHome'
export { TicketConversation } from './TicketConversation'

// Building blocks (exported for reuse / tests)
export { TicketCard } from './TicketCard'
export { TicketStatusBadge } from './TicketStatusBadge'
export { TicketActionFooter } from './TicketActionFooter'
export { MessageBubble } from './MessageBubble'
export { StatusCard } from './StatusCard'
export { FaqList } from './FaqList'
export { FaqItem } from './FaqItem'
export { CategoryGrid } from './CategoryGrid'
export { SupportSearchBar } from './SupportSearchBar'
export { GateBanner } from './GateBanner'
export { CoordinatorCard } from './CoordinatorCard'
export { CreateTicketSheet } from './CreateTicketSheet'
export { CallbackSheet } from './CallbackSheet'
export { SupportMarkdown } from './SupportMarkdown'
