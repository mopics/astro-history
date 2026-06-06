import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { astroChartRoutes } from './routes/astroChart'
import { timelineEventRoutes } from './routes/timelineEvent'

const app = new Hono()
app.use('*', cors())
app.route('/api', astroChartRoutes)
app.route('/api', timelineEventRoutes)

serve({ fetch: app.fetch, port: 3002 }, () => {
  console.log('Astro server running on http://localhost:3002')
})
