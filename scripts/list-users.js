const Database = require("better-sqlite3")
const fs = require("fs")
const path = require("path")

try {
  const dbPath = path.join(process.cwd(), "data", "emails.db")
  
  if (!fs.existsSync(dbPath)) {
    console.error("❌ Database file not found at:", dbPath)
    console.log("The database hasn't been initialized yet.")
    process.exit(1)
  }

  const db = new Database(dbPath, {
    timeout: 30000, // Wait up to 30 seconds for locks
    readonly: true // Read-only for listing
  })
  
  // Enable WAL mode for better concurrent access
  db.pragma("journal_mode = WAL")
  // Set busy timeout to 30 seconds
  db.pragma("busy_timeout = 30000")
  // Increase cache size
  db.pragma("cache_size = 10000")

  // List all users
  const users = db.prepare(`
    SELECT 
      username, 
      email, 
      role, 
      is_active,
      created_at,
      last_login
    FROM users
    ORDER BY created_at DESC
  `).all()

  if (users.length === 0) {
    console.log("ℹ️  No users found in database")
    console.log("\nTo create an admin user:")
    console.log("  node scripts/create-admin.js admin yourpassword")
    process.exit(0)
  }

  console.log("\n📋 Users in database:\n")
  console.log("═".repeat(80))
  
  users.forEach((user, index) => {
    console.log(`\n${index + 1}. ${user.username}`)
    console.log(`   Email: ${user.email || 'N/A'}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Status: ${user.is_active ? '✓ Active' : '✗ Inactive'}`)
    console.log(`   Created: ${user.created_at}`)
    console.log(`   Last Login: ${user.last_login || 'Never'}`)
  })
  
  console.log("\n" + "═".repeat(80))
  console.log(`\nTotal users: ${users.length}`)
  console.log(`Admin users: ${users.filter(u => u.role === 'admin').length}`)
  console.log(`Active users: ${users.filter(u => u.is_active).length}`)

  db.close()
} catch (error) {
  console.error("❌ Error listing users:", error.message)
  process.exit(1)
}
