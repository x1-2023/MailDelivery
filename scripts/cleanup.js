const { cleanupExpiredEmails } = require("../lib/email-service")

async function runCleanup() {
  try {
    console.log("Starting email cleanup...")
    await cleanupExpiredEmails()
    console.log("Email cleanup completed successfully")
  } catch (error) {
    console.error("Error during cleanup:", error)
    process.exit(1)
  }
}

// Run cleanup every hour
setInterval(runCleanup, 60 * 60 * 1000)

// Run cleanup immediately
runCleanup()
