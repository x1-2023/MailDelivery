const bcrypt = require("bcryptjs")
const Database = require("better-sqlite3")
const fs = require("fs")
const path = require("path")

const username = process.argv[2]
const newPassword = process.argv[3]

if (!username || !newPassword) {
  console.log("Usage: node reset-admin-password.js <username> <new-password>")
  console.log("Example: node reset-admin-password.js admin NewPassword123")
  process.exit(1)
}

try {
  // Ensure data directory exists
  const dataDir = path.join(process.cwd(), "data")
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  // Use auth.db for user authentication
  const dbPath = path.join(dataDir, "auth.db")
  
  if (!fs.existsSync(dbPath)) {
    console.error("❌ Database file not found at:", dbPath)
    console.log("The database hasn't been initialized yet. Try starting the application first.")
    process.exit(1)
  }

  const db = new Database(dbPath, {
    timeout: 30000, // Wait up to 30 seconds for locks
    readonly: false
  })
  
  // Enable WAL mode for better concurrent access
  db.pragma("journal_mode = WAL")
  // Set busy timeout to 30 seconds
  db.pragma("busy_timeout = 30000")
  // Increase cache size
  db.pragma("cache_size = 10000")

  // Check if user exists
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username)
  
  if (!user) {
    console.error(`❌ User '${username}' not found in database`)
    console.log("\nAvailable users:")
    const allUsers = db.prepare("SELECT username, role FROM users").all()
    allUsers.forEach(u => {
      console.log(`  - ${u.username} ${u.role === 'admin' ? '(admin)' : ''}`)
    })
    process.exit(1)
  }

  // Hash new password
  const hashedPassword = bcrypt.hashSync(newPassword, 10)

  // Update password
  db.prepare("UPDATE users SET password = ? WHERE username = ?").run(
    hashedPassword,
    username
  )

  console.log(`✅ Password updated successfully for user: ${username}`)
  console.log(`   New password: ${newPassword}`)
  console.log(`\nYou can now login with:`)
  console.log(`   Username: ${username}`)
  console.log(`   Password: ${newPassword}`)

  db.close()
} catch (error) {
  console.error("❌ Error resetting password:", error.message)
  process.exit(1)
}
