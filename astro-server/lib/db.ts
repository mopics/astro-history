import Database from 'better-sqlite3'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.resolve(__dirname, '../../db.sqlite')

export const db = new Database(DB_PATH)

db.exec(`
  CREATE TABLE IF NOT EXISTS timeline_events (
    uid         TEXT PRIMARY KEY,
    day         INTEGER NOT NULL,
    month       INTEGER NOT NULL,
    year        INTEGER NOT NULL,
    time        REAL    NOT NULL,
    lat         REAL    NOT NULL,
    lon         REAL    NOT NULL,
    name        TEXT    NOT NULL,
    description TEXT    NOT NULL DEFAULT '',
    tags        TEXT    NOT NULL DEFAULT '[]'
  )
`)
