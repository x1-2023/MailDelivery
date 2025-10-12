const { createUser, getUserByUsername } = require("../lib/auth-service")
const fs = require("fs")
const path = require("path")

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

    // Check if user already exists
    const existingUser = getUserByUsername(username)
    
    if (existingUser) {
      console.log(`ℹ️  Admin user '${username}' already exists.`)
      console.log("  Username:", existingUser.username)
      console.log("  Role:", existingUser.role)
      console.log("  Created:", existingUser.created_at)
      console.log("\n✓ Skipping admin creation (already exists)")
      process.exit(0)
    }

    console.log("Creating admin user...")
    const user = await createUser(username, password, "admin")
    console.log("✓ Admin created successfully!")
    console.log("  Username:", user.username)
    console.log("  Role:", user.role)
    console.log("  ID:", user.id)
    console.log("\nYou can now login with these credentials.")
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
