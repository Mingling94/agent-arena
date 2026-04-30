import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readLiveBattleSnapshot } from './src/arena/liveStream'
import { getSkin } from './src/arena/skins'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    {
      name: 'agent-arena-live-api',
      configureServer(server) {
        server.middlewares.use('/api/live/state', (_request, response) => {
          const snapshot = readLiveBattleSnapshot()
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify(snapshot))
        })

        server.middlewares.use('/api/skin', (request, response) => {
          const requestUrl = new URL(request.url ?? '', 'http://localhost')
          const skinPath = requestUrl.searchParams.get('skin') ?? 'default'
          const skin = getSkin(skinPath)
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify(skin))
        })
      },
    },
    react(),
  ],
})
