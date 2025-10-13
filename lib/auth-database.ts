import Database from "better-sqlite3"
import path from "path"
import fs from "fs"

// IMPORTANT: Use separate database file for auth to avoid lock conflicts with emails.db
// emails.db is used by sqlite (async) library
// auth.db is used by better-sqlite3 (sync) library
const dbPath = process.env.NODE_ENV === "production"
  ? "/var/www/opentrashmail/data/auth.db"
  : path.join(process.cwd(), "data", "auth.db")

// Ensure data directory exists before creating database
const dataDir = path.dirname(dbPath)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

export const authDb = new Database(dbPath, {
  timeout: 30000, // Wait up to 30 seconds for locks
  readonly: false,
  fileMustExist: false
})

// Enable WAL mode for better concurrent access
authDb.pragma("journal_mode = WAL")
// Set busy timeout to 30 seconds
authDb.pragma("busy_timeout = 30000")
// Optimize for concurrent access
authDb.pragma("synchronous = NORMAL")
authDb.pragma("cache_size = 10000")
authDb.pragma("temp_store = MEMORY")

// Initialize auth tables
export function initializeAuthTables() {
  authDb.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'user',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );

    -- User emails mapping
    CREATE TABLE IF NOT EXISTS user_emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      email_address TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, email_address)
    );

    -- Sessions table
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Temp emails table (moved from emails.db to avoid lock conflicts)
    CREATE TABLE IF NOT EXISTS temp_emails (
      email TEXT PRIMARY KEY,
      domain TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      user_id TEXT,
      is_anonymous INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_user_emails_user ON user_emails(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_emails_email ON user_emails(email_address);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_temp_emails_expires ON temp_emails(expires_at);
    CREATE INDEX IF NOT EXISTS idx_temp_emails_user ON temp_emails(user_id);
  `)

  // Add missing columns to users table (for existing databases)
  try {
    authDb.exec(`ALTER TABLE users ADD COLUMN email TEXT`)
  } catch (e) {
    // Column already exists
  }

  try {
    authDb.exec(`ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1`)
  } catch (e) {
    // Column already exists
  }

  try {
    authDb.exec(`ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`)
  } catch (e) {
    // Column already exists
  }
}

// Initialize on import
initializeAuthTables()

// ===== TEMP EMAILS OPERATIONS =====
// These functions handle temp_emails table in auth.db

export interface TempEmailRecord {
  email: string
  domain: string
  expires_at: string
  user_id?: string | null
  is_anonymous: number
  created_at: string
}

/**
 * Create or update a temp email
 */
export function createOrUpdateTempEmail(email: string, domain: string, expires_at: string, user_id?: string | null, is_anonymous: number = 1): TempEmailRecord {
  const stmt = authDb.prepare(`
    INSERT OR REPLACE INTO temp_emails (email, domain, expires_at, user_id, is_anonymous)
    VALUES (?, ?, ?, ?, ?)
  `)
  
  stmt.run(email, domain, expires_at, user_id || null, is_anonymous)
  
  const result = authDb.prepare("SELECT * FROM temp_emails WHERE email = ?").get(email) as TempEmailRecord
  return result
}

/**
 * Delete temp email by email address
 */
export function deleteTempEmail(email: string): boolean {
  const stmt = authDb.prepare("DELETE FROM temp_emails WHERE email = ?")
  const result = stmt.run(email)
  return result.changes > 0
}

/**
 * Delete expired temp emails
 */
export function deleteExpiredTempEmails(): number {
  const now = new Date().toISOString()
  const stmt = authDb.prepare("DELETE FROM temp_emails WHERE expires_at < ?")
  const result = stmt.run(now)
  return result.changes
}

/**
 * Get temp email by address
 */
export function getTempEmail(email: string): TempEmailRecord | undefined {
  const stmt = authDb.prepare("SELECT * FROM temp_emails WHERE email = ?")
  return stmt.get(email) as TempEmailRecord | undefined
}

/**
 * Get all temp emails from auth.db
 */
export function getAllTempEmails(): TempEmailRecord[] {
  const stmt = authDb.prepare("SELECT * FROM temp_emails ORDER BY created_at DESC")
  return stmt.all() as TempEmailRecord[]
}

/**
 * Get temp emails for specific user
 */
export function getTempEmailsByUser(userId: string): TempEmailRecord[] {
  const stmt = authDb.prepare("SELECT * FROM temp_emails WHERE user_id = ? ORDER BY created_at DESC")
  return stmt.all(userId) as TempEmailRecord[]
}

/**
 * Get anonymous temp emails (no user_id)
 */
export function getAnonymousTempEmails(): TempEmailRecord[] {
  const stmt = authDb.prepare("SELECT * FROM temp_emails WHERE user_id IS NULL OR user_id = '' ORDER BY created_at DESC")
  return stmt.all() as TempEmailRecord[]
}
