import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'

import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const awsServerPackages = [
  '@aws-sdk/client-sesv2',
  '@aws-sdk/client-ssm',
  '@aws-sdk/credential-providers',
]

const config = defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  ssr: {
    external: awsServerPackages,
  },
  plugins: [
    nitro({
      plugins: ['src/server/plugins/ensureSecrets.ts'],
      traceDeps: awsServerPackages.map((pkg) => `${pkg}*`),
      rollupConfig: {
        external: awsServerPackages,
      },
      rolldownConfig: {
        external: awsServerPackages,
      },
      awsAmplify: {
        runtime: 'nodejs22.x',
      },
    }),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
