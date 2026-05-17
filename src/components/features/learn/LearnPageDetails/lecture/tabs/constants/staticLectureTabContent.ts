export type LectureDetailTabId =
  | 'description'
  | 'ai-summary'
  | 'transcript'
  | 'associated'

export const LECTURE_DETAIL_TABS: ReadonlyArray<{
  id: LectureDetailTabId
  label: string
}> = [
  { id: 'description', label: 'Description' },
  { id: 'ai-summary', label: 'AI Summary' },
  { id: 'transcript', label: 'Transcript' },
  { id: 'associated', label: 'Associated Lectures and Assignments' },
]

export const DEFAULT_LECTURE_TAB_ID: LectureDetailTabId = 'description'

export const STATIC_LECTURE_TAB_CONTENT: Record<LectureDetailTabId, string> = {
  description: `In this session we introduce **data structures and algorithms** as the foundation for writing efficient, interview-ready code.

You will learn how to reason about time and space complexity, when to use arrays versus linked structures, and how to approach problems systematically instead of memorising solutions.

**What we cover**
- Arrays, strings, and hash maps
- Stacks, queues, and sliding window patterns
- Trees, graphs, and traversal strategies
- Sorting, searching, and two-pointer techniques

By the end of this lecture you should be able to break down a medium-level coding problem, choose an appropriate structure, and explain your approach clearly to an interviewer.`,

  'ai-summary': `**Session summary**

This lecture recaps foundational DSA topics with emphasis on problem decomposition and complexity analysis.

**Key takeaways**
1. Start every problem by clarifying constraints and edge cases.
2. Prefer the simplest structure that meets time/space targets.
3. Practice explaining trade-offs out loud while you code.

**Suggested follow-up**
Review the practice sheet on hash maps and complete the warm-up problems before the next live session.`,

  transcript: `[00:00] Welcome everyone. Today we are starting with arrays and why they matter for interviews.

[00:42] Let us define time complexity informally. When we say O(n), we mean the work grows linearly with input size.

[02:15] Here is a two-pointer example on a sorted array. Notice how we avoid nested loops.

[05:30] Pause the video and try the warm-up on your own before we discuss the solution.

[08:10] For trees, always clarify whether the input is balanced and whether you may use extra space.

[12:00] We will continue with graphs in the next lecture. Until then, finish the linked assignment.`,

  associated: `**Associated lectures**
- Lecture 12: Arrays & Hash Maps — Recap
- Lecture 14: Trees & Graphs — Introduction
- Lecture 18: Sorting & Searching Patterns

**Associated assignments**
- Assignment: Two-Pointer Practice Set (due 12 May 2026)
- Assignment: Tree Traversals Lab (due 15 May 2026)
- Assignment: Weekly DSA Quiz #4 (due 17 May 2026)`,
}
