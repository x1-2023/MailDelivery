const bcrypt = require("bcryptjs")
const Database = require("better-sqlite3")
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")

// Wait for database file to exist
async function waitForDatabase(maxRetries = 10, delayMs = 1000) {
  const dbPath = path.join(process.cwd(), "data", "emails.db")
  const dataDir = path.dirname(dbPath)
  
  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    console.log("Creating data directory...")
    fs.mkdirSync(dataDir, { recursive: true })
  }

  for (let i = 0; i < maxRetries; i++) {
    if (fs.existsSync(dbPath)) {
      console.log("✓ Database ready")
      return true
    }
    console.log(`⏳ Waiting for database to initialize... (${i + 1}/${maxRetries})`)
    await new Promise(resolve => setTimeout(resolve, delayMs))
  }
  
  console.log("⚠️  Database not found, will try to initialize...")
  return false
}

// Initialize database tables if not exists
function initializeDatabase(db) {
  db.exec(`
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

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, email)
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_user_emails_user_id ON user_emails(user_id);
  `)
}

function getUserByUsername(db, username) {
  return db.prepare("SELECT * FROM users WHERE username = ?").get(username)
}

function createUser(db, username, password, role = "user") {
  const hashedPassword = bcrypt.hashSync(password, 10)
  const userId = crypto.randomUUID()
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO users (id, username, password, role, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, 1, ?, ?)
  `).run(userId, username, hashedPassword, role, now, now)

  return {
    id: userId,
    username,
    role,
    created_at: now
  }
}

async function createAdmin() {
  const username = process.argv[2] || "admin"
  const password = process.argv[3]

  if (!password) {
    console.error("Usage: node scripts/create-admin.js <username> <password>")
    console.error("Example: node scripts/create-admin.js admin mypassword123")
    process.exit(1)
  }

  try {
    // Wait for database to be ready
    await waitForDatabase()

    const dbPath = path.join(process.cwd(), "data", "emails.db")
    const db = new Database(dbPath, {
      timeout: 30000, // Wait up to 30 seconds for locks (longer for scripts)
      readonly: false,
      fileMustExist: false
    })

    // Enable WAL mode for better concurrent access
    db.pragma("journal_mode = WAL")
    // Set busy timeout to 30 seconds
    db.pragma("busy_timeout = 30000")
    // Increase cache size
    db.pragma("cache_size = 10000")

    // Initialize tables if not exists
    initializeDatabase(db)

    // Check if user already exists
    const existingUser = getUserByUsername(db, username)
    
    if (existingUser) {
      console.log(`ℹ️  Admin user '${username}' already exists.`)
      console.log("  Username:", existingUser.username)
      console.log("  Role:", existingUser.role)
      console.log("  Created:", existingUser.created_at)
      console.log("\n✓ Skipping admin creation (already exists)")
      db.close()
      process.exit(0)
    }

    console.log("Creating admin user...")
    const user = createUser(db, username, password, "admin")
    console.log("✓ Admin created successfully!")
    console.log("  Username:", user.username)
    console.log("  Role:", user.role)
    console.log("  ID:", user.id)
    console.log("\nYou can now login with these credentials.")
    
    db.close()
  } catch (error) {
    console.error("✗ Error creating admin:", error.message)
    console.error("\nTroubleshooting:")
    console.error("  1. Make sure the application is running")
    console.error("  2. Check if data directory exists")
    console.error("  3. Try running the application first, then create admin")
    process.exit(1)
  }
}

createAdmin()
