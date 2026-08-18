# Support / Raise Ticket (`/support` + detail-page drawer)

## Scope

- **Raise Ticket drawer** (`RaiseTicketDrawer`): right-side Sheet opened from lecture / assignment / resource detail headers (`LearnDetailDefaultActions` with `ticketCategory`). No page redirect. Steps: batch picker (multi-batch only) → issue picker → conversation. The query body mounts only while the drawer is open (no `QueryClient` needed when the CTA is merely on screen).
- **Context subcategory list** (`ContextSubcategoryList`): the legacy `SubcategoryTicketModal` flow — a flat "What can we help you with?" list scoped to the page's category (`lecture` / `resource` / `assignment`), fetched via `GET /api/support/subcategories?category=`. These context categories live only as `{value}-subcategory` rows in `menus`, so they are NOT in the `tickets-category` help tree. Falls back to a single "General" option when empty.
- **Ticket conversation** (`TicketConversationPanel` + `useTicketComposer`): create / reply / rate / escalate, attachment upload (embedded as markdown links), status-aware footer (composer while open; 👍/👎 + "Reopen to escalate" once resolved/closed). Prop-driven (no URL coupling) so it embeds in the drawer.
- **Resolved ticket feedback** (`ResolvedTicketFeedback`): submitting a rating or reopening/escalating requires at least one selected reason or a non-blank comment.
- **Ticket title generation**: on create, `resolveTicketTitle` tries Anthropic Claude (`ANTHROPIC_MODEL` or default `claude-haiku-4-5`, 1.5s timeout) when `ANTHROPIC_API_KEY` is set and `SUPPORT_AI_TITLES` is not `false`; otherwise falls through deterministically: entity title + subcategory → first message line → category + subcategory → `"Support request"`. Stores `title_source` in `tickets.data`. Entity titles load via `fetchEntityTitleForTicket` when `entity_id` is present.
- **Raised tickets list ordering**: `listTickets` sorts by `created_at` desc; `TicketListingPage` and floating-chat `TicketList` merge normal + callback rows via `mergeRaisedSupportItems` so both appear newest-raised first.
- **First template response**: on ticket creation a real, public coordinator comment is inserted (`buildFirstTemplateResponse`) — a faithful port of the legacy `createTicketV2` initial comment (exact body + signature). L1 display name/phone resolve from batch settings + routing track (`showAdminNameInTicketReply` → assignee name; assignment/evaluation track → "Curriculum Co-ordinator", no phone; else `opsRoleTitles.l1` or "Program Co-ordinator" with `phNumbers.ph_l1`). The synthetic `open`/`re-opened` status banner is suppressed (the real comment carries it).
- **Ticket info audit trail**: `createTicket` writes initial `info.log` via `createTicketAudit.service`; `reopenTicket` and `escalateTicket` append legacy lines via `ticketInfo.service` (matching experience-api wording + `logstamps` / `meta` counters).
- **Markdown rendering** (`SupportMarkdown`): GFM + inline HTML (`rehype-raw` → `rehype-sanitize`) so legacy comment HTML (`<br/>`, `<b>`, links) and the new first-template reply render as real line breaks while unsafe HTML is stripped; links open in a new tab.
- **Request a Callback gate**: CTA shows only for new-user-journey students (a `user_batch_admission_data` row) with an active batch (`isNewUserJourney`), matching the legacy `is_new_user_journey` gate (NOT "reasons exist"). The "Student-Kit" reason is hidden unless the active batch has full fees paid (`hasFullFees`). Both flags come from `getCallbackEligibility` on the single overview GET.

## Test files

| Area                                                      | File                                                                                                         |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Context subcategory list UI (list / fallback / loading)   | `src/components/features/support/__tests__/ContextSubcategoryList.test.tsx`                                  |
| Subcategories-by-category service (menu → label)          | `src/server/api/support/services/__tests__/getSubcategoriesByCategory.test.ts`                               |
| First template reply (title/phone/admin-name/body)        | `src/server/api/support/services/__tests__/ticketReplyTemplate.test.ts`                                      |
| Ticket title resolver (AI + fallbacks + entity lookup)    | `src/server/api/support/services/__tests__/generateTicketTitle.test.ts`                                      |
| Ticket info audit (escalate / reopen patches)             | `src/server/api/support/services/__tests__/ticketInfo.service.test.ts`                                       |
| Create-ticket audit fields (timestamps, info, logstamps)  | `src/server/api/support/services/__tests__/createTicket.test.ts`                                             |
| Raised list merge sort (tickets + callbacks)              | `src/lib/support/__tests__/mergeRaisedSupportItems.test.ts`                                                  |
| Callback eligibility (journey / full-fees / driver shape) | `src/server/api/support/services/__tests__/getCallbackEligibility.test.ts`                                   |
| Markdown HTML rendering (br/signature, sanitize, links)   | `src/components/features/support/__tests__/SupportMarkdown.test.tsx`                                         |
| Resolved feedback required input + submit/reopen paths    | `src/components/common/floating-chat/ResolvedTicketFeedback.test.tsx`                                        |
| Raise Ticket CTA opens drawer (lecture/resource actions)  | `src/components/features/learn/LearnPageDetails/{lecture,resource}/shared/__tests__/*DetailActions.test.tsx` |

## Commands

```bash
npm run test -- src/server/api/support src/components/features/support
npm run typecheck
npm run lint
```

## Notes

- The auto-reply bubble header shows the assignee's name + role (new-LMS bubble convention); the tailored coordinator title/phone appear in the message signature, so the reply content matches the legacy comment.
- Drawer batch resolution uses the overview (single batch auto-selects; multi-batch shows a picker) because the learn detail payload does not carry the entity's `batchId`. Exact legacy parity (use the entity's own batch, no picker) would require adding `batchId` to the detail payload.
- Coverage gap: the drawer step machine (`RaiseTicketDrawer`) and `useTicketComposer` are not yet unit-tested end-to-end; covered indirectly via the CTA-opens-drawer tests and the unit-tested pieces they compose.
