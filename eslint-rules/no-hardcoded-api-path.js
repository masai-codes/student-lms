// AGENTS.md "What NOT to do": never hard-code `/api/...` URL strings; define
// them once in a `*Paths.ts` constants file. Scope which files this applies
// to (excluding *Paths.ts and tests) via `files`/`ignores` in eslint.config.js.

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow hardcoded /api/ path string literals outside *Paths.ts files.',
    },
    schema: [],
    messages: {
      hardcodedPath:
        'Hardcoded API path "{{text}}" — define it once in a *Paths.ts constants file and import it (see AGENTS.md "What NOT to do").',
    },
  },
  create(context) {
    function checkText(node, text) {
      if (/^\/api\//.test(text)) {
        context.report({ node, messageId: 'hardcodedPath', data: { text } })
      }
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string') checkText(node, node.value)
      },
      TemplateLiteral(node) {
        const first = node.quasis[0]
        if (first) checkText(node, first.value.raw)
      },
    }
  },
}
