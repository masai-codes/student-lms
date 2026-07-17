# Chatbot (text + voice mode)

Last updated: 2026-06-17

## Scope

- Shared conversation layout in `MessageList` via `ChatbotConversationLayout` for both text and voice modes; assistant replies render markdown (`ChatbotAssistantMessage` + shared `MarkdownContent`)
- Voice mode uses the same message timeline as text chat (`mergeDisplayMessages` with `full` display mode includes voice transcripts in `MessageList`)
- Voice footer: `ChatbotVoiceControls` with small `AIAvatar` (heartbeat pulse while agent is speaking), end-session cross, and mute/unmute — no text input in voice mode
- ChatGPT-style turn scroll: latest user message snaps to the top of the message viewport
- User message max height: 30% of viewport with bottom-aligned clipping when overflow
- Smooth scroll on subsequent user sends; instant snap when loading history
- Voice subtitle utilities remain for legacy caption trimming tests; live voice UI uses the shared message list
- Token creation: `POST /api/chatbot/:lectureId/token` resolves lecture access + transcript (same helper as AI Tutor) and passes `lecture_id` / `lecture_transcript` to the LiveKit agent metadata

## Test files

| File                                                                           | Covers                                                                                         |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `src/components/features/chatbot/utils/chatScroll.test.ts`                     | Spacer height, max height ratio, latest user lookup, scroll offset math                        |
| `src/components/features/chatbot/utils/voiceSubtitle.test.ts`                  | Voice subtitle selection from merged display messages                                          |
| `src/components/features/chatbot/utils/voiceSubtitleViewport.test.ts`          | Fixed-height voice subtitle top trimming                                                       |
| `src/components/features/chatbot/hooks/useChatTurnScroll.test.tsx`             | ResizeObserver viewport sizing, instant vs smooth snap, no re-scroll on assistant-only updates |
| `src/components/features/chatbot/hooks/useIsMobileViewport.test.ts`            | Mobile breakpoint detection and media-query subscription                                       |
| `src/server/api/chatbot/__tests__/token.service.test.ts`                       | LiveKit token metadata includes lecture id + transcript                                        |
| `src/components/features/chatbot/components/ChatbotHistoryHeader.test.tsx`     | Desktop sidebar close control + lecture header title                                           |
| `src/components/features/chatbot/components/ChatbotPreSessionWelcome.test.tsx` | Pre-session greeting, disclaimer, and prompt selection                                         |
| `src/components/features/chatbot/components/ChatbotAssistantMessage.test.tsx`  | Assistant bubble markdown rendering (bold, lists, empty content)                               |
| `src/components/features/chatbot/components/ChatbotComposer.test.tsx`          | Composer submit keys                                                                           |
| `src/components/features/chatbot/components/ChatbotMobileShell.test.tsx`       | Mobile full-bleed composer dock, inline send, drawer voice activation                          |
| `src/components/features/chatbot/components/ChatbotVoiceControls.test.tsx`     | Voice footer controls, avatar speaking state, mic toggle                                       |
| `src/components/common/AIAvatar.test.tsx`                                      | Speaking pulse animation class                                                                 |

## Commands

```bash
npm run test -- src/components/features/chatbot src/server/api/chatbot
npm run typecheck
npm run lint
```

## Manual QA

1. Mobile (<768px): only the composer shows below the video until the user sends a message; chat opens in a bottom drawer.
2. Desktop (≥768px): video is full width on load; an **Ask** pill in the video controls opens a wider clamped sidebar, and a header close control returns to full video. The same pill is available in fullscreen and opens a right-side overlay there.
3. Mobile: dismiss the drawer with an active session — inline composer remains; sending reopens the drawer.
4. Pre-session: send a long prompt — bottom of text remains visible in the top-aligned bubble.
5. Send a second prompt — prior turn scrolls up smoothly; new prompt takes the top slot.
6. Open a history session with multiple turns — latest user message snaps instantly to top.
7. Assistant streams below without re-scrolling the user bubble.
8. Voice mode: messages appear in the shared history list in real time (user and assistant turns).
9. Voice mode: cross ends voice session (switches to text); mute toggles mic; avatar pulses while the agent is speaking.
10. Resize the panel — 30% cap and spacer recalculate.

Update this file and `feature-test-matrix.md` when chatbot scroll behavior or tests change.
