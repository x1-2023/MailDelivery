const { createUser, getUserByUsername } = require("../lib/auth-service")

async function createAdmin() {
  const username = process.argv[2] || "admin"
  const password = process.argv[3]

  if (!password) {
    console.error("Usage: node scripts/create-admin.js <username> <password>")
    console.error("Example: node scripts/create-admin.js admin mypassword123")
    process.exit(1)
  }

  try {
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
    process.exit(1)
  }
}

createAdmin()
