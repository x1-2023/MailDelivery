const Database = require('better-sqlite3')
const path = require('path')

function checkDatabase(dbPath, dbName) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`Checking: ${dbName}`)
  console.log('='.repeat(60))
  
  try {
    const db = new Database(dbPath, { readonly: true })
    
    // Get all tables
    const tables = db.prepare(`
      SELECT name, sql 
      FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all()
    
    console.log(`\nFound ${tables.length} tables:\n`)
    
    tables.forEach(table => {
      console.log(`\n📊 TABLE: ${table.name}`)
      console.log('-'.repeat(60))
      console.log(table.sql)
      
      // Count rows
      try {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get()
        console.log(`\n✓ Rows: ${count.count}`)
      } catch (e) {
        console.log(`\n✗ Error counting rows: ${e.message}`)
      }
      
      // Get columns
      try {
        const columns = db.pragma(`table_info(${table.name})`)
        console.log('\nColumns:')
        columns.forEach(col => {
          console.log(`  - ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.dflt_value ? ` DEFAULT ${col.dflt_value}` : ''}${col.pk ? ' PRIMARY KEY' : ''}`)
        })
      } catch (e) {
        console.log(`Error getting columns: ${e.message}`)
      }
    })
    
    // Get indexes
    const indexes = db.prepare(`
      SELECT name, sql 
      FROM sqlite_master 
      WHERE type='index' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all()
    
    if (indexes.length > 0) {
      console.log(`\n\n📑 INDEXES (${indexes.length}):`)
      console.log('-'.repeat(60))
      indexes.forEach(idx => {
        if (idx.sql) console.log(idx.sql)
      })
    }
    
    // Check PRAGMA settings
    console.log(`\n\n⚙️  PRAGMA SETTINGS:`)
    console.log('-'.repeat(60))
    console.log('journal_mode:', db.pragma('journal_mode', { simple: true }))
    console.log('foreign_keys:', db.pragma('foreign_keys', { simple: true }))
    console.log('synchronous:', db.pragma('synchronous', { simple: true }))
    console.log('page_size:', db.pragma('page_size', { simple: true }))
    console.log('cache_size:', db.pragma('cache_size', { simple: true }))
    
    // Check integrity
    console.log(`\n\n🔍 INTEGRITY CHECK:`)
    console.log('-'.repeat(60))
    const integrity = db.pragma('integrity_check')
    integrity.forEach(result => console.log(result.integrity_check))
    
    db.close()
    return true
  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`)
    return false
  }
}

// Check both databases
console.log('\n🔬 DATABASE SCHEMA ANALYSIS\n')

const authDbPath = path.join(process.cwd(), 'Database_test', 'auth.db')
const emailsDbPath = path.join(process.cwd(), 'Database_test', 'emails.db')

checkDatabase(authDbPath, 'auth.db')
checkDatabase(emailsDbPath, 'emails.db')

console.log('\n' + '='.repeat(60))
console.log('✅ Analysis complete!')
console.log('='.repeat(60) + '\n')
