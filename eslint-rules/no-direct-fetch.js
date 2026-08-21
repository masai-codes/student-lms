// AGENTS.md: "Never call fetch directly in feature code; always go through
// fetchJson." Scope to client-side layers via eslint.config.js `files`,
// excluding fetchJson.ts itself.

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow calling the global fetch directly; use fetchJson instead.',
    },
    schema: [],
    messages: {
      directFetch:
        'Call fetchJson from "@/lib/api/fetchJson" instead of the global fetch — it handles relative/absolute URLs and cookie forwarding consistently. If this call genuinely needs raw fetch (third-party API, special cookie handling), add an eslint-disable-next-line with the reason.',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type === 'Identifier' && node.callee.name === 'fetch') {
          context.report({ node, messageId: 'directFetch' })
        }
      },
    }
  },
}
