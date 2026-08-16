// project-coding-guidelines.mdc "Automation Test Hooks": every interactive
// element needs a stable data-testid so agenthand/Puppeteer suites can
// target it. Flags native/interactive tags and any element wiring an
// onClick handler. Elements using spread props are skipped since a
// data-testid could arrive through the spread and can't be verified statically.

const DEFAULT_TAGS = ['button', 'a', 'Button']

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require a data-testid on interactive JSX elements.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          tags: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingTestId:
        '<{{name}}> is interactive but has no data-testid — add a stable, kebab-case, feature-prefixed data-testid (e.g. "feature-element") so automation can target it (see coding guidelines "Automation Test Hooks").',
    },
  },
  create(context) {
    const tags = new Set(context.options[0]?.tags ?? DEFAULT_TAGS)

    return {
      JSXOpeningElement(node) {
        const name = node.name.type === 'JSXIdentifier' ? node.name.name : null
        const hasOnClick = node.attributes.some(
          (attr) =>
            attr.type === 'JSXAttribute' && attr.name.name === 'onClick',
        )
        const isTargetTag = name !== null && tags.has(name)
        if (!isTargetTag && !hasOnClick) return

        const hasSpread = node.attributes.some(
          (attr) => attr.type === 'JSXSpreadAttribute',
        )
        if (hasSpread) return

        const hasTestId = node.attributes.some(
          (attr) =>
            attr.type === 'JSXAttribute' && attr.name.name === 'data-testid',
        )
        if (!hasTestId) {
          context.report({
            node,
            messageId: 'missingTestId',
            data: { name: name ?? 'element' },
          })
        }
      },
    }
  },
}
