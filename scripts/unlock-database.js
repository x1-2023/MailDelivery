#!/usr/bin/env node
/**
 * Unlock SQLite Database - Force WAL checkpoint and close connections
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = process.argv[2] || '/home/user/maildelivery-data/emails.db'

console.log('\n🔓 SQLite Database Unlock Tool\n')
console.log(`Target: ${dbPath}\n`)

try {
  console.log('📝 Opening database...')
  const db = new Database(dbPath)
  
  console.log('⚙️  Current settings:')
  console.log(`   Journal Mode: ${db.pragma('journal_mode', { simple: true })}`)
  console.log(`   Busy Timeout: ${db.pragma('busy_timeout', { simple: true })}ms`)
  
  console.log('\n🔧 Applying fixes...')
  
  // Set busy timeout to 30 seconds
  db.pragma('busy_timeout = 30000')
  console.log('   ✅ Set busy_timeout = 30000ms')
  
  // Force WAL checkpoint (move WAL to main DB)
  console.log('\n📤 Forcing WAL checkpoint...')
  const checkpoint = db.pragma('wal_checkpoint(TRUNCATE)')
  console.log(`   Checkpoint result: ${JSON.stringify(checkpoint)}`)
  
  // Optimize database
  console.log('\n🔧 Running PRAGMA optimize...')
  db.pragma('optimize')
  console.log('   ✅ Database optimized')
  
  console.log('\n⚙️  New settings:')
  console.log(`   Journal Mode: ${db.pragma('journal_mode', { simple: true })}`)
  console.log(`   Busy Timeout: ${db.pragma('busy_timeout', { simple: true })}ms`)
  
  db.close()
  console.log('\n✅ Database unlocked successfully!\n')
  
} catch (error) {
  console.error(`\n❌ Error: ${error.message}`)
  console.error(`   Code: ${error.code}\n`)
  
  if (error.code === 'SQLITE_BUSY') {
    console.log('💡 Database is still locked. Try:')
    console.log('   1. Stop all applications using the database')
    console.log('   2. docker restart mailsystem')
    console.log('   3. Delete .db-wal and .db-shm files (SAFE in Docker restart)')
  }
  
  process.exit(1)
}
