# AI Chat Migration — Completed Study (Expo → Web)

Study result produced by reading the full **Lecture AI Chat** feature in the Expo app, following [`AI_CHAT_MIGRATION_GUIDE.md`](AI_CHAT_MIGRATION_GUIDE.md). This is the "answers" document — the guide holds the "questions."

**Related docs:** [`docs/lecture-ai-chat.md`](docs/lecture-ai-chat.md) (feature spec) · [`docs/ai-tutor-chat-stream.md`](docs/ai-tutor-chat-stream.md) (API/streaming) · [`docs/lecture-details-ai-chat-layout.md`](docs/lecture-details-ai-chat-layout.md) (layout).

---

## TL;DR — the one insight that shapes the migration

> **All business logic already lives in framework-agnostic React + plain TypeScript** (`hooks/`, `services/lectureAiChat/`, `types/`). It copies to the web app almost verbatim. **~90% of the migration effort is deleting React Native presentation code** (bottom sheet, pager, ~600-line manual FlatList scroll math, reanimated) and re-skinning with shadcn. **Do not rewrite the streaming or state logic — port it.**

The guide called the entry point `LectureAIHost`; the real file is [`LectureAIChatHost.tsx`](components/LectureDetails/LectureAIChat/LectureAIChatHost.tsx).

---

## 1. Actual component hierarchy

```
app/home/lecture/[id].tsx                         (screen, mounts host when !fullscreen && hasTranscript)
└── LectureAIChatHost                             ← open/history/feedback UI state + send routing
    │     props: lectureId, lectureTitle, enabled, isOpen, onOpenChange, composerDisabled
    │     owns: useLectureAIChat (active thread) + useLectureAIConversations (history list)
    │
    ├── LectureAIChatInput                        ← pinned input, position:absolute bottom, z-30 (ALWAYS visible)
    │   └── LectureAIChatComposerRow              ← TextInput (multiline, max 96px) + send button
    │
    ├── LectureAIChatDrawer                       ← @gorhom/bottom-sheet INLINE BottomSheet
    │   │   snapPoints = [collapsed≈input+55, 90% height]; index 0 on mount; pan-down disabled
    │   ├── renderHandle                          ← drag bar + "Swipe up to start chatting" hint (fades via animatedIndex)
    │   ├── BottomSheetBackdrop                   ← 50% opacity, appears at index 1, press → collapse
    │   └── LectureAIChatDrawerPager              ← react-native-pager-view, 2 horizontal pages
    │       ├── [page 0] LectureAIChatHistoryPanel
    │       │   ├── LectureAIChatPanelHeader      ← "Chat History" | New chat (create-outline) | Back
    │       │   └── BottomSheetFlatList
    │       │       └── LectureAIChatConversationItem[]   ← title + relative time, active highlight
    │       └── [page 1] LectureAIChatChatPanel
    │           ├── LectureAIChatPanelHeader      ← "Lecture AI Chat" | history (time-outline) | minimize
    │           └── LectureAIChatMessages         ← BottomSheetFlatList (the scroll brain)
    │               ├── ChatMessageRow (memo)
    │               │   ├── user   → right purple (#6962AC) bubble
    │               │   └── assistant → MarkdownRenderer + StreamingCursor | TypingDots | error+Retry
    │               ├── ListEmptyComponent → LectureAIChatEmptyState → LectureAIChatSuggestionChips (SVG SweepBorder)
    │               ├── ListFooterComponent → dynamic spacer (pins live turn to top)
    │               └── floating "scroll to latest" button (absolute)
    │
    └── LectureAIChatFeedbackModal                ← RN Modal, 1–5 emoji rating + optional text (max 500)
```

**Unused / dead code (safe to drop, do not port):**
- `LectureAIChatComposer` (the in-sheet composer variant in [`LectureAIChatInput.tsx`](components/LectureDetails/LectureAIChat/LectureAIChatInput.tsx)) — exported, never rendered. Legacy of the old modal pattern.
- `LectureAIChatHistoryButton` — defined and imported into `LectureAIChatComposerRow` but **never rendered**.
- In [`LectureAIChatComposerRow.tsx`](components/LectureDetails/LectureAIChat/LectureAIChatComposerRow.tsx): `historySlotWidth`, `historyOpacity`, `historySlotStyle`, the collapse effect, and the `onPressHistory` prop are all dead — no history control is in the JSX. **Consequence:** from the collapsed/closed state the user cannot reach history; they must expand the sheet first, then tap the clock icon in the chat header.

---

## 2. State flow & source of truth

**Source of truth for the active thread = [`useLectureAIChat`](hooks/useLectureAIChat.ts) — plain React `useState`/`useRef`, NOT React Query.** The history *list* is the only React-Query-backed piece.

| State | Where | Created by | Updated by | Consumed by |
|-------|-------|-----------|-----------|-------------|
| `messages: LectureAIChatMessage[]` | `useLectureAIChat` | `useState([])` | `sendMessage`, stream callbacks, `selectConversation`, `startNewConversation` | Messages list, feedback eligibility |
| `isSending` | `useLectureAIChat` | `useState(false)` | stream start/complete/error | input disable, feedback gating |
| `activeChatId: number\|null` | `useLectureAIChat` | `useState(null)` | `onComplete(chatId)`, `selectConversation` | request body, history active-row highlight, feedback payload |
| `isLoadingConversation` | `useLectureAIChat` | `useState(false)` | `selectConversation` | chat panel spinner |
| `conversations[]` | `useLectureAIConversations` (React Query) | `useQuery` key `['lectureAIConversations', lectureId]`, `enabled: isHistoryOpen`, stale 2m | `invalidateQueries` after each completed stream | history panel |
| `isHistoryOpen`, `isSelectingConversation`, feedback modal state | `LectureAIChatHost` | `useState` | host handlers | drawer/pager, feedback modal |

**Refs in the hook (imperative, survive renders):** `chatIdRef` (thread id sent in the stream body), `cancelStreamRef` (abort fn), `lastRequestRef` + `lastAssistantMessageIdRef` (retry target), `selectGenerationRef` (stale-response guard for concurrent `selectConversation`).

**Refs in the host (feedback eligibility):** `isNewThreadRef` (only fresh in-visit threads qualify), `submittedChatIdsRef` / `dismissedChatIdsRef` (dedupe), `selectionTokenRef` (guards concurrent selects).

**Message model** ([`types/lectureAiChat.ts`](types/lectureAiChat.ts)):

```ts
type LectureAIChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: "sent" | "thinking" | "streaming" | "completed" | "error";
  createdAt: number;
};
```

---

## 3. Event flow

| Event | What happens |
|-------|--------------|
| User types in pinned input | Local `value` state in `LectureAIChatInput`; send enabled when `value.trim()` non-empty |
| User sends (input or suggestion chip) | If `activeChatId` null → `isNewThreadRef = true` + `startNewConversation()`; then `sendMessage(text)`; on success `onOpenChange(true)` expands sheet |
| AI starts typing | `onFirstChunk` flips the assistant bubble `thinking → streaming` (clears "Thinking…") |
| AI token received | `onChunk` appends to assistant `content` |
| AI completed | `onComplete(chatId)` syncs `activeChatId`, marks `completed`, invalidates the conversations query |
| API failed | `onError` sets assistant `status: "error"` + generic copy; a **Retry** button appears |
| User retries | `retryLastResponse()` re-runs the last request into the same assistant bubble |
| User scrolls up | `autoAnchorSuspendedRef` stops auto re-anchor; floating scroll-to-latest button shows |
| User minimizes drawer | `handleMinimizeDrawer` collapses sheet and may trigger the feedback modal |
| User opens history | `openHistory()` expands sheet + pages to History; the list query fires (enabled only now) |
| User selects a thread | `selectConversation(chatId)` fetches detail, hydrates `messages`, returns to chat page |
| User leaves / `enabled=false` | Aborts active stream, closes drawer + history |

---

## 4. Message lifecycle (send)

```
sendMessage(text)  [guard: non-empty && !isSending]
  → build request { lectureId, chat, chatId: chatIdRef.current }   (chatId omitted on first message)
  → append USER msg      status "sent"
  → append ASSISTANT msg content "Thinking…"  status "thinking"
  → startAssistantStream():
        clearActiveStream(); setIsSending(true); streamLectureAIChat(request, handlers)
        ├ onFirstChunk → assistant: status "streaming", content ""
        ├ onChunk(t)   → assistant: content += t   (status "streaming")
        ├ onComplete(chatId) → if chatId: syncActiveChatId(chatId); assistant: "completed";
        │                      setIsSending(false); invalidate conversations query
        └ onError      → assistant: "error", content "Something went wrong. Please try again."; setIsSending(false)
  → return true  → host calls onOpenChange(true) to expand the drawer
```

`retryLastResponse()` reuses `lastRequestRef` + `lastAssistantMessageIdRef`, resets that assistant bubble to "Thinking…", and re-streams. It reuses the **same `chatId`** and does **not** re-append the user message.

`selectConversation(chatId)` (history): generation-guarded; `clearActiveStream()`, `GET /conversations/:chatId`, `mapChatHistoryToMessages` → user rows become `sent`, assistant rows `completed`, IDs `history-${chatId}-${index}`.

---

## 5. API & streaming (port this exactly)

Base URL: `EXPO_PUBLIC_STUDENTS_NEW_URL`. Mobile auth: `Authorization: Bearer <token>` from `useAuthStore` ([`client.ts`](services/lectureAiChat/client.ts)). **On web, swap to session cookie + `credentials: 'include'`** (see [`docs/ai-tutor-chat-stream.md`](docs/ai-tutor-chat-stream.md)).

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai-tutor/chat/stream` | POST | Stream a reply (SSE). Body `{ lectureId, chat, chatID? }` — note wire key is **`chatID`**; `chat` ≤ 4000 chars |
| `/api/ai-tutor/chat/conversations?lectureId=` | GET | History list `{ conversations: [{ chatId, title, updatedAt }] }` |
| `/api/ai-tutor/chat/conversations/:chatId` | GET | Detail `{ chatId, chat: [{ role, content, createdAt? }] }` (oldest→newest) |
| `/api/ai-tutor/chat/feedback` | POST | `{ lectureId, chatId, rating 1–5, feedback?, platform }` |

**Streaming protocol** ([`stream.ts`](services/lectureAiChat/stream.ts) + [`lectureAiChat.sse.ts`](services/lectureAiChat.sse.ts)):
- Uses `expo/fetch` (streamable body on RN). **Web: use the browser `fetch` + `response.body.getReader()` — identical `ReadableStream` API, no change to the loop.**
- SSE frames: `data: {"type":"token","content":"…"}\n\n` … terminated by `data: {"type":"done","chatId":N}\n\n`.
- `createSseBuffer()` is **pure TS** that reassembles events split across network chunks — **port verbatim**.
- Cancel = `AbortController.abort()` (stored in `cancelStreamRef`).
- If response is `!ok` or not `text/event-stream`, the JSON error body is parsed to a `code` string (`parseAiTutorError`). CloudFront may mask 404/403 as 422 (`x-true-status`).

Thread continuity: omit `chatID` on the first message → server returns the new `chatId` in the `done` event → echo it back on every follow-up.

---

## 6. Scroll behaviour (hardest RN piece — mostly deleted on web)

[`LectureAIChatMessages.tsx`](components/LectureDetails/LectureAIChat/LectureAIChatMessages.tsx) hand-builds two modes on a `BottomSheetFlatList`:

- **Live turn** (just asked, assistant `thinking`/`streaming`): `pinLatestTurn = true`. The user's question is anchored to the **top** (`scrollToIndex` + `viewOffset`), and a computed `footerSpacerHeight` reserves blank space so a single fresh turn can sit at the top — the ChatGPT "question jumps up, answer streams below" effect. It **silently re-anchors** as the answer grows, with a fade-out→scroll→fade-in transition.
- **Loaded-from-history turn** (already answered): `scrollToEnd` to the natural bottom, no reserve.
- Once the user **drags**, `autoAnchorSuspendedRef` stops the re-anchor from fighting them; it re-enables on the next turn.
- A floating **scroll-to-latest** button appears when scrolled away (`distanceFromBottom > 120`).
- Extra machinery: `onScrollToIndexFailed` retry loop (`MAX_ANCHOR_RETRIES`), per-turn `onLayout` height measurement, fade shared values.

**On web this whole file is replaced by `MessageScroller` / `MessageScrollerViewport` / `MessageScrollerContent` / `MessageScrollerButton`.** Auto-scroll, scroll-lock-on-user-scroll, and jump-to-latest are built in. The only bespoke behaviour worth reproducing is the optional "pin question to top" for a live turn (a scroll target + a spacer), if product wants it.

---

## 7. Migration mapping (Expo → Web / shadcn)

### Business logic — PORT (copy, minimal edits)

| Expo file | Web action |
|-----------|-----------|
| [`hooks/useLectureAIChat.ts`](hooks/useLectureAIChat.ts) | Copy as-is (pure React). |
| [`hooks/useLectureAIChatHistory.ts`](hooks/useLectureAIChatHistory.ts) | Copy as-is (React Query). |
| [`services/lectureAiChat/stream.ts`](services/lectureAiChat/stream.ts) | Copy; `expo/fetch` → browser `fetch`. |
| [`services/lectureAiChat.sse.ts`](services/lectureAiChat.sse.ts) | Copy verbatim (pure TS). |
| [`services/lectureAiChat/history.ts`](services/lectureAiChat/history.ts) · [`feedback.ts`](services/lectureAiChat/feedback.ts) | Copy; only `fetch` + base URL. |
| [`services/lectureAiChat/client.ts`](services/lectureAiChat/client.ts) | **Rewrite auth**: Bearer token → session cookie (`credentials:'include'`); new base URL. |
| [`types/lectureAiChat.ts`](types/lectureAiChat.ts) · `services/.../types.ts` | Copy verbatim. |
| [`lectureAiChatSuggestions.ts`](components/LectureDetails/LectureAIChat/lectureAiChatSuggestions.ts) | Copy verbatim. |
| Feedback eligibility logic in `LectureAIChatHost` | Copy the ref-based gating; re-skin the modal only. |

### Presentation — REPLACE

| Expo | Web (shadcn / React) |
|------|----------------------|
| `@gorhom/bottom-sheet` (`LectureAIChatDrawer`) | shadcn **Drawer** (vaul) on mobile; **Sheet**/side panel or inline column on desktop |
| `BottomSheetFlatList` + all anchor/footer/fade code | **MessageScroller** family — delete the custom scroll math |
| floating scroll-to-bottom `Pressable` | **MessageScrollerButton** |
| `react-native-pager-view` (chat ↔ history) | Tabs / conditional render; on desktop, history as a persistent sidebar |
| user `ChatMessageRow` bubble | `div`/**Card**, right-aligned |
| assistant `MarkdownRenderer` | `react-markdown` + rehype, shadcn code-block styling |
| `StreamingCursor` / `TypingDots` (reanimated) | **MessageAnimated** / CSS keyframes |
| `LectureAIChatSuggestionChips` (SVG `SweepBorder`) | **Button**/**Badge** chips + CSS animated gradient border |
| `LectureAIChatInput` (absolute pinned) | **InputGroup** sticky at bottom of the chat column |
| `LectureAIChatComposerRow` `TextInput` | auto-growing **Textarea**; Enter-to-send, Shift+Enter newline |
| `LectureAIChatFeedbackModal` (RN Modal) | **Dialog** + rating buttons + **Tooltip** |
| `LectureAIChatEmptyState` | **Empty** |
| `ActivityIndicator` | Spinner |
| `Ionicons` | `lucide-react` |
| `PanelHeader` icon buttons | **Button** (ghost/icon) + **DropdownMenu** for overflow |
| reanimated / `Animated` | Framer Motion / `tailwindcss-animate` / CSS |
| `KeyboardAvoidingView`, safe-area insets, `Platform.OS` | Not needed (CSS layout); send `platform: "web"` |

---

## 8. Notes

### LectureAIChatHost
- Owns only **UI orchestration** state (drawer open, history open, feedback modal); delegates *all* chat/streaming to `useLectureAIChat`. Clean separation → easy port.
- Every send path (pinned input **and** suggestion chip) funnels through one idea: if `activeChatId` is null, mark `isNewThreadRef` + `startNewConversation()`, then `sendMessage()`, then expand.
- Feedback is offered **on drawer minimize** (`handleMinimizeDrawer`), and only for a **fresh in-visit thread that has a completed answer**, deduped via `submitted`/`dismissed` ref sets. History-loaded threads never prompt.
- `enabled === false` tears everything down: closes drawer + history and aborts the active stream.

### Message List (`LectureAIChatMessages`)
- Two scroll modes (live = pin question to top with dynamic footer spacer; history = scroll to bottom). This is the bulk of the file and is replaced by `MessageScroller`.
- User drag suspends auto re-anchor for the current turn; a new turn re-enables it.
- `keyExtractor = message.id`. IDs: live = `user-…` / `assistant-…` (`createMessageId`); loaded = `history-${chatId}-${index}`.
- Assistant content is markdown; streaming shows a blinking cursor; `thinking` (or streaming with no content yet) shows three typing dots.

### API
- Four endpoints on the `STUDENTS_NEW` host. Mobile = Bearer token; **web = session cookie (`credentials:'include'`)**.
- Wire key is **`chatID`** (capital) even though the client type is `chatId`. `chat` ≤ 4000, trimmed server-side.
- Thread continuity: omit id on first message, read it from the `done` event, echo on follow-ups.
- History list is sorted **newest-first on the client** (`sortNewestFirst` via `parseUtcTimestamp`).

### Streaming
- `expo/fetch` → `ReadableStream` reader; `createSseBuffer` yields `token`/`done` events; concatenate `token.content`.
- First token flips `thinking → streaming`; `done` carries `chatId`; abort via `AbortController`.
- Non-SSE / non-OK response → JSON error parsed to a `code` string.

### Improvements (noticed while reading — worth doing on web, some worth fixing in Expo too)
- **Dead code:** `LectureAIChatComposer`, `LectureAIChatHistoryButton`, and the `historySlot*`/`onPressHistory` machinery in `LectureAIChatComposerRow` are unused. Don't port; consider deleting in Expo.
- **History reachability:** because that history button is never rendered, history is only reachable after expanding the sheet. On web, put a visible "History" affordance next to the input.
- **`retryLastResponse` reuses the same `chatId` and doesn't re-add the user message** — confirm server semantics (regenerate vs. new turn) before wiring retry on web.
- **Duplicated loading flags:** `isLoadingConversation` (hook) and `isSelectingConversation` (host) track the same thing (`isLoadingConversation || isSelectingConversation` is passed down). Consolidate on web.
- **Web wins for free:** auto-scroll, scroll-lock-on-scroll-up, and jump-to-latest all come from `MessageScroller`, so the ~600-line `LectureAIChatMessages` collapses to a thin render.

---

## 9. Suggested implementation order (web)

1. Port `types/` → `services/lectureAiChat/` (fix `client.ts` auth) → verify a raw stream call in isolation.
2. Port `useLectureAIChat` + `useLectureAIChatHistory` unchanged.
3. Build the shell: chat column + `InputGroup`, wired to the hook (no fancy scroll yet).
4. Drop in `MessageScroller` + `MessageScrollerButton`; delete all manual scroll intent.
5. Message rendering: user bubble, assistant markdown + code blocks + copy, typing/streaming states via `MessageAnimated`.
6. Suggestions (`Empty` + chips) → history (Drawer/Sheet + list) → feedback `Dialog`.
7. Responsive pass (mobile drawer vs desktop side panel), then retry/error/abort testing.

---

## Final deliverable coverage (web AI chat should support)

Conversation history · streaming responses · smooth message rendering · auto-scroll · scroll-lock when scrolled up · jump-to-latest · retry · loading state · error state · suggestions · markdown rendering · code blocks · copy actions · mobile-responsive layout.
