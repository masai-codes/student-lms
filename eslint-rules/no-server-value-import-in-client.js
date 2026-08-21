// AGENTS.md "What NOT to do": don't import server-only modules (Drizzle,
// @/db, @/server/...) into components or lib/api files; use type-only
// imports where only the type is needed. `import type { X } from '@/server/...'`
// is fine and intentionally allowed here.

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow value imports of @/db or @/server modules from client-side code.',
    },
    schema: [],
    messages: {
      serverImport:
        'Client code must not import runtime values from "{{source}}" — use `import type` for types, and reach this feature through its REST API + fetchJson instead (see AGENTS.md "What NOT to do").',
    },
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const src = node.source.value
        if (typeof src !== 'string') return
        if (
          !(
            src === '@/db' ||
            src.startsWith('@/db/') ||
            src.startsWith('@/server/')
          )
        )
          return
        if (node.importKind === 'type') return

        const hasValueSpecifier = node.specifiers.some((specifier) => {
          if (specifier.type === 'ImportSpecifier')
            return specifier.importKind !== 'type'
          return true
        })

        if (hasValueSpecifier) {
          context.report({
            node,
            messageId: 'serverImport',
            data: { source: src },
          })
        }
      },
    }
  },
}
