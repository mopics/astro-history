import { Hono } from 'hono'
import { db } from '../lib/db'

export type TimelineEvent = {
  uid: string
  day: number
  month: number
  year: number
  time: number
  lat: number
  lon: number
  name: string
  description: string
  tags: string[]
}

type EventRow = Omit<TimelineEvent, 'tags'> & { tags: string }

function rowToEvent(row: EventRow): TimelineEvent {
  return { ...row, tags: JSON.parse(row.tags) as string[] }
}

export const timelineEventRoutes = new Hono()

// POST /api/createTimelineEvent
timelineEventRoutes.post('/createTimelineEvent', async (c) => {
  const body = await c.req.json<Partial<TimelineEvent>>()

  const { uid, day, month, year, time, lat, lon, name, description = '', tags = [] } = body

  if (!uid || typeof uid !== 'string') return c.json({ error: 'uid is required' }, 400)
  if (typeof day !== 'number')         return c.json({ error: 'day must be a number' }, 400)
  if (typeof month !== 'number')       return c.json({ error: 'month must be a number' }, 400)
  if (typeof year !== 'number')        return c.json({ error: 'year must be a number' }, 400)
  if (typeof time !== 'number')        return c.json({ error: 'time must be a number' }, 400)
  if (typeof lat !== 'number')         return c.json({ error: 'lat must be a number' }, 400)
  if (typeof lon !== 'number')         return c.json({ error: 'lon must be a number' }, 400)
  if (!name || typeof name !== 'string') return c.json({ error: 'name is required' }, 400)
  if (!Array.isArray(tags))            return c.json({ error: 'tags must be an array' }, 400)

  try {
    db.prepare(`
      INSERT INTO timeline_events (uid, day, month, year, time, lat, lon, name, description, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uid, day, month, year, time, lat, lon, name, description, JSON.stringify(tags))

    return c.json({ uid }, 201)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (msg.includes('UNIQUE constraint')) return c.json({ error: `uid '${uid}' already exists` }, 409)
    return c.json({ error: msg }, 500)
  }
})

// GET /api/getTimelineEvent/:uid
timelineEventRoutes.get('/getTimelineEvent/:uid', (c) => {
  const uid = c.req.param('uid')
  const row = db.prepare('SELECT * FROM timeline_events WHERE uid = ?').get(uid) as EventRow | undefined
  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json({ event: rowToEvent(row) })
})

// GET /api/listTimelineEvents
timelineEventRoutes.get('/listTimelineEvents', (c) => {
  const rows = db.prepare('SELECT * FROM timeline_events ORDER BY year, month, day').all() as EventRow[]
  return c.json({ events: rows.map(rowToEvent) })
})

// PUT /api/updateTimelineEvent/:uid
timelineEventRoutes.put('/updateTimelineEvent/:uid', async (c) => {
  const uid  = c.req.param('uid')
  const body = await c.req.json<Partial<Omit<TimelineEvent, 'uid'>>>()

  const existing = db.prepare('SELECT * FROM timeline_events WHERE uid = ?').get(uid) as EventRow | undefined
  if (!existing) return c.json({ error: 'Not found' }, 404)

  const merged = {
    day:         typeof body.day         === 'number' ? body.day         : existing.day,
    month:       typeof body.month       === 'number' ? body.month       : existing.month,
    year:        typeof body.year        === 'number' ? body.year        : existing.year,
    time:        typeof body.time        === 'number' ? body.time        : existing.time,
    lat:         typeof body.lat         === 'number' ? body.lat         : existing.lat,
    lon:         typeof body.lon         === 'number' ? body.lon         : existing.lon,
    name:        typeof body.name        === 'string' ? body.name        : existing.name,
    description: typeof body.description === 'string' ? body.description : existing.description,
    tags:        Array.isArray(body.tags)             ? JSON.stringify(body.tags) : existing.tags,
  }

  db.prepare(`
    UPDATE timeline_events
    SET day=?, month=?, year=?, time=?, lat=?, lon=?, name=?, description=?, tags=?
    WHERE uid=?
  `).run(merged.day, merged.month, merged.year, merged.time, merged.lat, merged.lon,
         merged.name, merged.description, merged.tags, uid)

  const updated = db.prepare('SELECT * FROM timeline_events WHERE uid = ?').get(uid) as EventRow
  return c.json({ event: rowToEvent(updated) })
})

// DELETE /api/deleteTimelineEvent/:uid
timelineEventRoutes.delete('/deleteTimelineEvent/:uid', (c) => {
  const uid    = c.req.param('uid')
  const result = db.prepare('DELETE FROM timeline_events WHERE uid = ?').run(uid)
  if (result.changes === 0) return c.json({ error: 'Not found' }, 404)
  return c.json({ deleted: uid })
})
