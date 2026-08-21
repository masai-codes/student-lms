import { isApiDocsEnabled } from '@/server/api/docs/isApiDocsEnabled'

function notFound(): Response {
  return new Response('Not Found', { status: 404 })
}

function renderSwaggerUiHtml(specUrl = '/api/docs/openapi.json'): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Student LMS API docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />
  <style>
    body { margin: 0; }
    .topbar { display: none; }
    .prod-banner {
      background: #fef3c7; color: #92400e; padding: 0.6rem 1rem; font: 14px/1.4 system-ui, sans-serif;
    }
  </style>
</head>
<body>
  <div class="prod-banner">Dev/staging only — this UI returns 404 when NODE_ENV=production.</div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: ${JSON.stringify(specUrl)},
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [SwaggerUIBundle.presets.apis],
      layout: 'BaseLayout',
    })
  </script>
</body>
</html>`
}

export function handleGetDocsUi(): Response {
  if (!isApiDocsEnabled()) return notFound()

  return new Response(renderSwaggerUiHtml(), {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
