#!/usr/bin/env node
const Database = require('better-sqlite3')
const path = require('path')

function removeDuplicateIndexes(dbPath, dbName) {
  console.log(`\n📋 Processing: ${dbName}`)
  console.log('='.repeat(60))
  
  const db = new Database(dbPath)
  
  try {
    db.pragma('foreign_keys = OFF') // Temporarily disable to allow index drops
    
    const duplicates = {
      'Database_test/auth.db': [
        'idx_sessions_user_id',      // Keep idx_sessions_user
        'idx_user_emails_user_id'    // Keep idx_user_emails_user
      ],
      'Database_test/emails.db': [
        // No critical duplicates, but can remove unused ones
        'idx_emails_subject',        // Rarely used
        'idx_emails_from_address'    // Rarely used
      ]
    }
    
    const toDrop = dbName.includes('auth') 
      ? duplicates['Database_test/auth.db']
      : duplicates['Database_test/emails.db']
    
    if (toDrop && toDrop.length > 0) {
      console.log(`\nDropping ${toDrop.length} duplicate/unused indexes...`)
      
      for (const indexName of toDrop) {
        // Check if index exists
        const exists = db.prepare(
          "SELECT name FROM sqlite_master WHERE type='index' AND name=?"
        ).get(indexName)
        
        if (exists) {
          try {
            db.prepare(`DROP INDEX ${indexName}`).run()
            console.log(`  ✓ Dropped: ${indexName}`)
          } catch (e) {
            console.log(`  ✗ Failed to drop ${indexName}: ${e.message}`)
          }
        } else {
          console.log(`  - Not found: ${indexName}`)
        }
      }
    } else {
      console.log('No indexes to drop')
    }
    
    db.pragma('foreign_keys = ON')
    
    // Verify
    const remainingIndexes = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='index' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all()
    
    console.log(`\n✅ Remaining indexes: ${remainingIndexes.length}`)
    remainingIndexes.forEach(idx => console.log(`  - ${idx.name}`))
    
    // Run VACUUM to reclaim space
    console.log('\n🔄 Running VACUUM to reclaim space...')
    db.exec('VACUUM')
    console.log('✓ VACUUM complete')
    
    db.close()
    return true
  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`)
    db.close()
    return false
  }
}

// Main
console.log('\n🔧 REMOVING DUPLICATE INDEXES\n')

const authDbPath = path.join(process.cwd(), 'Database_test', 'auth.db')
const emailsDbPath = path.join(process.cwd(), 'Database_test', 'emails.db')

const authOk = removeDuplicateIndexes(authDbPath, 'auth.db')
const emailsOk = removeDuplicateIndexes(emailsDbPath, 'emails.db')

console.log('\n' + '='.repeat(60))
if (authOk && emailsOk) {
  console.log('✅ All duplicate indexes removed successfully!')
  console.log('\nNow you can copy cleaned databases to data/ folder:')
  console.log('  cp Database_test/auth.db data/auth.db')
  console.log('  cp Database_test/emails.db data/emails.db')
} else {
  console.log('⚠️  Some operations failed. Check logs above.')
}
console.log('='.repeat(60) + '\n')
