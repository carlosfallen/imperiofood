import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import solidJs from '@astrojs/solid-js'
import tailwind from '@astrojs/tailwind'

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    mode: 'directory'
  }),
  integrations: [
    solidJs(),
    tailwind({ applyBaseStyles: false })
  ]
})
