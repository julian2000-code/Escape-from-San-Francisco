import Database, { Database as DatabaseType } from 'better-sqlite3'
import { config } from '../../../config/environment'
import { initializeDatabase } from './schema'

// Create database connection
// SQLite locally, PostgreSQL on Railway (via DATABASE_URL)
const db: DatabaseType = new Database(config.database.sqlitePath, {
  verbose: config.isLocal ? console.log : undefined
})

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Initialize schema
initializeDatabase(db)

export { db }
