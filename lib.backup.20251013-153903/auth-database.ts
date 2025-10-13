import Database from "better-sqlite3"
import path from "path"
import fs from "fs"

const dbPath = path.join(process.cwd(), "data", "emails.db")

// Ensure data directory exists before creating database
const dataDir = path.dirname(dbPath)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

export const authDb = new Database(dbPath, {
  timeout: 30000, // Wait up to 30 seconds for locks (increased)
  readonly: false,
  fileMustExist: false
})

// Enable WAL mode for better concurrent access
authDb.pragma("journal_mode = WAL")
// Set busy timeout to 30 seconds (increased for high load)
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

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_user_emails_user ON user_emails(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_emails_email ON user_emails(email_address);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  `)

  // Add columns to temp_emails if not exists
  try {
    authDb.exec(`ALTER TABLE temp_emails ADD COLUMN user_id TEXT`)
  } catch (e) {
    // Column already exists
  }

  try {
    authDb.exec(`ALTER TABLE temp_emails ADD COLUMN is_anonymous INTEGER DEFAULT 1`)
  } catch (e) {
    // Column already exists
  }

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
