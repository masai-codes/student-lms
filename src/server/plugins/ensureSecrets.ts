import { definePlugin } from 'nitro'
import { ensureSecrets } from '../../secrets'

export default definePlugin((nitroApp) => {
  nitroApp.hooks.hook('request', async () => {
    await ensureSecrets()
  })
})