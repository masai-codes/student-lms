// AGENTS.md HTTP utilities table: "always use these, never create raw
// Response objects" (jsonOk / jsonError / mapThrownErrorToResponse). The
// http/ layer itself is the exception; scope via eslint.config.js `ignores`.

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow constructing a raw Response outside the shared http response layer.',
    },
    schema: [],
    messages: {
      rawResponse:
        'Do not construct a raw Response here — use jsonOk/jsonError/mapThrownErrorToResponse from "@/server/api/http/responses" so response shapes stay consistent. If this endpoint genuinely needs a non-JSON response (webhook ack, streaming, HTML), move it under src/server/api/http/ or disable with a reason.',
    },
  },
  create(context) {
    return {
      NewExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'Response'
        ) {
          context.report({ node, messageId: 'rawResponse' })
        }
      },
    }
  },
}
