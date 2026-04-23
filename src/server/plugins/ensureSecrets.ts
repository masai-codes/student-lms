import { definePlugin } from 'nitro'
import { ensureSecrets } from '../../secrets'
import type { HTTPEvent } from 'nitro/h3'

export default definePlugin((nitroApp) => {
  nitroApp.hooks.hook('request', async (event:HTTPEvent) => {
    // const data = await event.req.formData()
    console.log('event', event.req.method, event.req._url?.pathname)
    // if(event.req.method === 'POST') {
      // const data = await event.req.formData()
      // console.log('data', data)
    // }
    await ensureSecrets()
  })
  nitroApp.hooks.hook('response',  (res:Response, event: HTTPEvent) => {
    console.log('sending response',event.req.method, event.req._url?.pathname, res.status)
  })
  nitroApp.hooks.hook('error', (err:Error) => {
    console.log('error', JSON.stringify(err.message), JSON.stringify(err.stack))
  })
})