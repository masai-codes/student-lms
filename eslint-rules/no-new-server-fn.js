// AGENTS.md "What NOT to do": "Do not add new createServerFn calls. ... All
// new backend logic goes through src/routes/api/ -> handler -> service."
// The legacy pattern is kept only under src/server/**; scope this rule to
// everywhere else via eslint.config.js `ignores`.

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow new createServerFn usage outside the legacy src/server/ layer.',
    },
    schema: [],
    messages: {
      noNewServerFn:
        'createServerFn is the legacy server-function pattern (kept only under src/server/**). New backend work must use the REST API pattern: src/routes/api/** route -> handler -> service (see AGENTS.md).',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'createServerFn'
        ) {
          context.report({ node, messageId: 'noNewServerFn' })
        }
      },
    }
  },
}
