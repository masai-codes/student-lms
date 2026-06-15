# Chatbot (text mode)

Last updated: 2026-06-15

## Scope

- Text conversation layout in `MessageList` via `ChatbotConversationLayout`
- ChatGPT-style turn scroll: latest user message snaps to the top of the message viewport
- User message max height: 30% of viewport with bottom-aligned clipping when overflow
- Smooth scroll on subsequent user sends; instant snap when loading history

## Test files

| File | Covers |
|------|--------|
| `src/components/features/chatbot/utils/chatScroll.test.ts` | Spacer height, max height ratio, latest user lookup, scroll offset math |
| `src/components/features/chatbot/hooks/useChatTurnScroll.test.tsx` | ResizeObserver viewport sizing, instant vs smooth snap, no re-scroll on assistant-only updates |
| `src/components/features/chatbot/hooks/useIsMobileViewport.test.ts` | Mobile breakpoint detection and media-query subscription |

## Commands

```bash
npm run test -- src/components/features/chatbot
npm run typecheck
npm run lint
```

## Manual QA

1. Mobile (<768px): only the composer shows below the video until the user sends a message; chat opens in a bottom drawer.
2. Mobile: dismiss the drawer with an active session — inline composer remains; sending reopens the drawer.
3. Pre-session: send a long prompt — bottom of text remains visible in the top-aligned bubble.
4. Send a second prompt — prior turn scrolls up smoothly; new prompt takes the top slot.
5. Open a history session with multiple turns — latest user message snaps instantly to top.
6. Assistant streams below without re-scrolling the user bubble.
7. Resize the panel — 30% cap and spacer recalculate.

Update this file and `feature-test-matrix.md` when chatbot scroll behavior or tests change.
