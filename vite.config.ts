/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

/**
 * Dev-only stand-in for the `delivery-quote` edge function, so delivery quotes
 * work on localhost without Docker/Deno. Runs the same shared module and reads
 * DELIVERY_ORIGIN from .env server-side — it is never exposed to the client.
 * Pricing comes from the delivery_settings table, read with the anon key.
 */
function devDeliveryQuote(env: Record<string, string>): Plugin {
  return {
    name: 'dev-delivery-quote',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__dev/delivery-quote', async (req, res) => {
        const send = (status: number, body: unknown) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(body))
        }
        if (req.method !== 'POST') return send(405, { error: 'Method not allowed' })

        try {
          let raw = ''
          for await (const chunk of req) raw += chunk
          const { address } = JSON.parse(raw || '{}')
          const delivery = await server.ssrLoadModule(
            '/supabase/functions/_shared/delivery.ts',
          )
          const settings = await delivery.loadDeliverySettings(
            env.VITE_SUPABASE_URL,
            env.VITE_SUPABASE_ANON_KEY,
          )
          const quote = await delivery.quoteDelivery(
            String(address ?? ''),
            delivery.parseOrigin(env.DELIVERY_ORIGIN),
            settings,
          )
          send(200, quote)
        } catch (err) {
          const status = (err as { status?: number }).status ?? 500
          send(status, { error: err instanceof Error ? err.message : 'Internal error' })
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      devDeliveryQuote(env),
      // Add after: npm install -D rollup-plugin-visualizer
      // visualizer({ open: false, filename: 'dist/stats.html' }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      testTimeout: 15_000,
      env: {
        SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
      },
    },
  }
})
