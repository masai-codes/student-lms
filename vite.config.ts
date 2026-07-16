import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'

import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig({
  server: {
    allowedHosts: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    // Server-only AWS SDK package. Its static `export { fromTokenFile }`
    // re-export chain fails to resolve under the browser conditions the
    // client dep-scanner uses (esbuild "No matching export ... fromTokenFile").
    // It is stripped from the client bundle by TanStack Start, so keep it out
    // of the client pre-bundling step entirely.
    exclude: ['@aws-sdk/credential-providers'],
  },
  plugins: [
    nitro({
      preset: 'node-server',
    }),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart({ spa: { enabled: true } }),
    viteReact(),
  ],
})

export default config
