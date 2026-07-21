/**
 * Support feature — public component barrel.
 *
 * The `/support` route renders {@link BatchTickets}, which composes the Help,
 * Raised Tickets, and 1:1 Support tabs (faithful to the legacy experience-ui
 * flow). See `src/server/api/support/START_HERE.md` for the backend tour.
 */
export { BatchTickets } from './BatchTickets'
export { TicketListingPage } from './TicketListingPage'
export { CreateTicketModal } from './CreateTicketModal'
export { CategoryAccordion } from './CategoryAccordion'
export { PairProgrammingTab } from './PairProgrammingTab'
export { SupportMarkdown } from './SupportMarkdown'
