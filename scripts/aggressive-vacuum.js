#!/usr/bin/env node
const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

function getFileSize(filePath) {
  const stats = fs.statSync(filePath)
  return (stats.size / 1024 / 1024).toFixed(2)
}

function aggressiveVacuum(dbPath, dbName) {
  console.log(`\n${'='.repeat(70)}`)
  console.log(`🔧 AGGRESSIVE VACUUM: ${dbName}`)
  console.log('='.repeat(70))
  
  const sizeBefore = getFileSize(dbPath)
  console.log(`📊 Size before: ${sizeBefore} MB`)
  
  const db = new Database(dbPath)
  
  try {
    // 1. Analyze to update statistics
    console.log('\n1️⃣ Running ANALYZE...')
    db.exec('ANALYZE')
    console.log('   ✓ Complete')
    
    // 2. Reindex all tables
    console.log('\n2️⃣ Reindexing all tables...')
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all()
    
    tables.forEach(t => {
      console.log(`   - Reindexing ${t.name}...`)
      db.exec(`REINDEX ${t.name}`)
    })
    console.log('   ✓ Complete')
    
    // 3. Enable aggressive settings
    console.log('\n3️⃣ Setting aggressive PRAGMA...')
    db.pragma('auto_vacuum = FULL')
    db.pragma('page_size = 4096')
    db.pragma('incremental_vacuum')
    console.log('   ✓ Complete')
    
    // 4. Run VACUUM (this will take time for large DBs)
    console.log('\n4️⃣ Running VACUUM (this may take a while)...')
    const vacuumStart = Date.now()
    db.exec('VACUUM')
    const vacuumTime = ((Date.now() - vacuumStart) / 1000).toFixed(2)
    console.log(`   ✓ Complete in ${vacuumTime}s`)
    
    // 5. Optimize settings
    console.log('\n5️⃣ Re-applying optimal PRAGMA...')
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    db.pragma('synchronous = NORMAL')
    db.pragma('cache_size = 10000')
    db.pragma('temp_store = MEMORY')
    console.log('   ✓ Complete')
    
    // 6. Integrity check
    console.log('\n6️⃣ Running integrity check...')
    const integrity = db.pragma('integrity_check')
    const isOk = integrity.length === 1 && integrity[0].integrity_check === 'ok'
    if (isOk) {
      console.log('   ✓ Database integrity: OK')
    } else {
      console.log('   ⚠️  Database integrity issues:')
      integrity.forEach(i => console.log('     -', i.integrity_check))
    }
    
    db.close()
    
    // 7. Check size reduction
    const sizeAfter = getFileSize(dbPath)
    const reduction = ((sizeBefore - sizeAfter) / sizeBefore * 100).toFixed(1)
    
    console.log(`\n📊 Results:`)
    console.log(`   Size before:  ${sizeBefore} MB`)
    console.log(`   Size after:   ${sizeAfter} MB`)
    console.log(`   Reduction:    ${reduction}% (saved ${(sizeBefore - sizeAfter).toFixed(2)} MB)`)
    
    return { before: sizeBefore, after: sizeAfter, reduction }
  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`)
    db.close()
    return null
  }
}

// Main
console.log('\n🗜️  AGGRESSIVE DATABASE VACUUM & OPTIMIZATION\n')
console.log('This will:')
console.log('  - Run ANALYZE to update statistics')
console.log('  - Reindex all tables')
console.log('  - Run VACUUM to reclaim space')
console.log('  - Optimize PRAGMA settings')
console.log('  - Verify integrity\n')

const authDbPath = path.join(process.cwd(), 'Database_test', 'auth.db')
const emailsDbPath = path.join(process.cwd(), 'Database_test', 'emails.db')

// Create backup before VACUUM
console.log('📦 Creating safety backup...')
const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
fs.copyFileSync(authDbPath, `${authDbPath}.pre-vacuum.${timestamp}`)
fs.copyFileSync(emailsDbPath, `${emailsDbPath}.pre-vacuum.${timestamp}`)
console.log('   ✓ Backup created\n')

// Run VACUUM on both databases
const authResult = aggressiveVacuum(authDbPath, 'auth.db')
const emailsResult = aggressiveVacuum(emailsDbPath, 'emails.db')

// Summary
console.log('\n' + '='.repeat(70))
console.log('📊 FINAL SUMMARY')
console.log('='.repeat(70))

if (authResult) {
  console.log(`\n✅ auth.db:`)
  console.log(`   ${authResult.before} MB → ${authResult.after} MB (${authResult.reduction}% reduction)`)
}

if (emailsResult) {
  console.log(`\n✅ emails.db:`)
  console.log(`   ${emailsResult.before} MB → ${emailsResult.after} MB (${emailsResult.reduction}% reduction)`)
}

if (authResult && emailsResult) {
  const totalBefore = parseFloat(authResult.before) + parseFloat(emailsResult.before)
  const totalAfter = parseFloat(authResult.after) + parseFloat(emailsResult.after)
  const totalSaved = totalBefore - totalAfter
  const totalReduction = ((totalSaved / totalBefore) * 100).toFixed(1)
  
  console.log(`\n💾 Total:`)
  console.log(`   ${totalBefore.toFixed(2)} MB → ${totalAfter.toFixed(2)} MB`)
  console.log(`   Saved: ${totalSaved.toFixed(2)} MB (${totalReduction}% reduction)`)
  
  console.log('\n✅ VACUUM complete! Databases are now optimized.')
  console.log('\nNext step:')
  console.log('  cp Database_test/auth.db data/auth.db')
  console.log('  cp Database_test/emails.db data/emails.db')
} else {
  console.log('\n⚠️  Some operations failed. Check logs above.')
}

console.log('='.repeat(70) + '\n')
