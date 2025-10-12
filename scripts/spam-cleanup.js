/**
 * Spam Filter Auto-Deletion Cleanup Job
 * 
 * This script runs periodically to delete emails marked for auto-deletion
 * by spam filters. It does NOT affect the DELETE_OLDER_THAN_DAYS setting.
 * 
 * Usage:
 *   node scripts/spam-cleanup.js
 * 
 * Or add to cron (every 5 minutes):
 *   (cron) 0,5,10,15,20,25,30,35,40,45,50,55 * * * * cd /path/to/app && node scripts/spam-cleanup.js
 */

const { processAutoDeletion } = require('../lib/spam-filter-service')

async function runCleanup() {
  try {
    console.log('[Spam Cleanup] Starting auto-deletion cleanup...')
    const deletedCount = await processAutoDeletion()
    
    if (deletedCount > 0) {
      console.log(`[Spam Cleanup] ✓ Deleted ${deletedCount} spam emails`)
    } else {
      console.log('[Spam Cleanup] No emails to delete')
    }
  } catch (error) {
    console.error('[Spam Cleanup] Error:', error)
    process.exit(1)
  }
}

runCleanup()
  .then(() => {
    console.log('[Spam Cleanup] Completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('[Spam Cleanup] Fatal error:', error)
    process.exit(1)
  })
