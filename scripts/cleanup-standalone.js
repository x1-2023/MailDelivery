const Database = require("better-sqlite3")
const path = require("path")
const fs = require("fs")

// Standalone cleanup script - works in production without TypeScript
function cleanupExpiredEmails() {
  try {
    const dbPath = path.join(process.cwd(), "data", "emails.db")
    
    if (!fs.existsSync(dbPath)) {
      console.log("⚠️  Database not found, skipping cleanup")
      return
    }

    const db = new Database(dbPath, {
      timeout: 10000, // Wait up to 10 seconds for locks
      readonly: false
    })
    
    // Enable WAL mode for better concurrent access
    db.pragma("journal_mode = WAL")
    // Set busy timeout to 10 seconds
    db.pragma("busy_timeout = 10000")
    // Increase cache size
    db.pragma("cache_size = 10000")
    
    // Get DELETE_OLDER_THAN_DAYS from env or default to 1 day
    const daysToKeep = parseInt(process.env.DELETE_OLDER_THAN_DAYS || "1", 10)
    
    // Calculate cutoff date
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    const cutoffTimestamp = cutoffDate.getTime()

    // Delete old emails
    const deleteResult = db.prepare(`
      DELETE FROM emails 
      WHERE created_at < ?
    `).run(cutoffTimestamp)

    const deletedCount = deleteResult.changes

    if (deletedCount > 0) {
      console.log(`✓ Cleanup completed: Deleted ${deletedCount} emails older than ${daysToKeep} days`)
    } else {
      console.log(`✓ Cleanup completed: No old emails to delete`)
    }

    // Vacuum database to reclaim space
    db.exec("VACUUM")
    console.log("✓ Database optimized")

    db.close()
  } catch (error) {
    console.error("✗ Cleanup error:", error.message)
  }
}

async function runCleanup() {
  console.log(`[${new Date().toISOString()}] Starting email cleanup...`)
  cleanupExpiredEmails()
}

// Run cleanup every hour (3600000 ms)
const cleanupInterval = 60 * 60 * 1000
console.log(`Email cleanup service started (runs every ${cleanupInterval / 60000} minutes)`)

setInterval(runCleanup, cleanupInterval)

// Run cleanup immediately on start
runCleanup()
