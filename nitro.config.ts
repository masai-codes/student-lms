import { defineNitroConfig } from 'nitro/config'

export default defineNitroConfig({
  runtimeConfig: {
    databaseUrl: '',
    jwtSecretKey: '',
    cookieName: '',
  },
})
