// Enforces the theming rule in .cursor/rules/project-coding-guidelines.mdc
// ("Never hardcode a color") by scanning className strings / cn()-style
// calls for arbitrary hex/rgb/hsl values and literal Tailwind gray-scale or
// fixed white/black utilities, which bypass the semantic token system.

const HEX_OR_FUNCTION_COLOR = /-\[(#|rgba?\(|hsla?\()/
const GRAYSCALE_UTILITY =
  /\b(?:text|bg|border|ring|from|to|via|divide|outline|fill|stroke|shadow|decoration|caret|accent)-(?:gray|slate|zinc|neutral|stone)-\d{2,3}\b/
const FIXED_MONO_UTILITY =
  /\b(?:text|bg|border|ring|from|to|via|fill|stroke)-(?:white|black)\b/

function classify(text) {
  if (HEX_OR_FUNCTION_COLOR.test(text)) return 'a hardcoded hex/rgb/hsl color'
  if (GRAYSCALE_UTILITY.test(text))
    return 'a literal Tailwind gray-scale utility'
  if (FIXED_MONO_UTILITY.test(text)) return 'a fixed white/black utility'
  return null
}

function collectStringLikeNodes(node, results) {
  if (!node) return
  switch (node.type) {
    case 'Literal':
      if (typeof node.value === 'string')
        results.push({ node, text: node.value })
      break
    case 'TemplateLiteral':
      for (const quasi of node.quasis)
        results.push({ node: quasi, text: quasi.value.raw })
      break
    case 'LogicalExpression':
      collectStringLikeNodes(node.left, results)
      collectStringLikeNodes(node.right, results)
      break
    case 'ConditionalExpression':
      collectStringLikeNodes(node.consequent, results)
      collectStringLikeNodes(node.alternate, results)
      break
    case 'BinaryExpression':
      if (node.operator === '+') {
        collectStringLikeNodes(node.left, results)
        collectStringLikeNodes(node.right, results)
      }
      break
    case 'ArrayExpression':
      for (const el of node.elements) collectStringLikeNodes(el, results)
      break
    default:
      break
  }
}

const CLASSNAME_HELPERS = new Set(['cn', 'clsx', 'cva', 'twMerge'])

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow hardcoded colors in className strings; use semantic token utilities instead.',
    },
    schema: [],
    messages: {
      rawColor:
        'Found {{kind}} in "{{text}}". Colors must come from semantic token utilities (see docs/theming-token-map.md) so every theme re-themes correctly.',
    },
  },
  create(context) {
    function checkAll(results) {
      for (const { node, text } of results) {
        const kind = classify(text)
        if (kind) {
          context.report({
            node,
            messageId: 'rawColor',
            data: { kind, text: text.trim() },
          })
        }
      }
    }

    return {
      JSXAttribute(node) {
        if (
          node.name.type !== 'JSXIdentifier' ||
          node.name.name !== 'className'
        )
          return
        const results = []
        if (node.value?.type === 'Literal') {
          collectStringLikeNodes(node.value, results)
        } else if (node.value?.type === 'JSXExpressionContainer') {
          collectStringLikeNodes(node.value.expression, results)
        }
        checkAll(results)
      },
      CallExpression(node) {
        if (
          node.callee.type !== 'Identifier' ||
          !CLASSNAME_HELPERS.has(node.callee.name)
        )
          return
        const results = []
        for (const arg of node.arguments) collectStringLikeNodes(arg, results)
        checkAll(results)
      },
    }
  },
}
