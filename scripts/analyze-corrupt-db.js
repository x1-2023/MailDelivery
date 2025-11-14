#!/usr/bin/env node
/**
 * Database Corruption Analyzer
 * Analyze and attempt to recover corrupted SQLite databases
 */

const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

// ANSI colors for console
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function log(msg, color = 'white') {
  console.log(`${colors[color]}${msg}${colors.reset}`)
}

function analyzeDatabase(dbPath, dbName) {
  log(`\n${'='.repeat(70)}`, 'cyan')
  log(`🔍 ANALYZING: ${dbName}`, 'bold')
  log('='.repeat(70), 'cyan')
  
  if (!fs.existsSync(dbPath)) {
    log(`❌ File not found: ${dbPath}`, 'red')
    return { success: false, error: 'File not found' }
  }
  
  const stats = fs.statSync(dbPath)
  log(`\n📊 File Info:`, 'blue')
  log(`   Path: ${dbPath}`)
  log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
  log(`   Modified: ${stats.mtime.toISOString()}`)
  
  let db
  let result = {
    success: false,
    canOpen: false,
    tables: [],
    counts: {},
    errors: [],
    recoverable: false
  }
  
  try {
    // Try to open database
    log(`\n🔓 Opening database...`, 'blue')
    db = new Database(dbPath, { readonly: true })
    result.canOpen = true
    log(`   ✅ Database opened successfully`, 'green')
    
    // Check journal mode
    try {
      const journalMode = db.pragma('journal_mode', { simple: true })
      log(`\n⚙️  Configuration:`, 'blue')
      log(`   Journal Mode: ${journalMode}`)
      log(`   Foreign Keys: ${db.pragma('foreign_keys', { simple: true })}`)
      log(`   Page Size: ${db.pragma('page_size', { simple: true })}`)
    } catch (e) {
      log(`   ⚠️  Cannot read PRAGMA: ${e.message}`, 'yellow')
    }
    
    // Try to get tables
    log(`\n📋 Tables:`, 'blue')
    try {
      const tables = db.prepare(`
        SELECT name, sql 
        FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `).all()
      
      result.tables = tables.map(t => t.name)
      log(`   Found ${tables.length} tables: ${result.tables.join(', ')}`, 'green')
      
      // Count rows in each table
      log(`\n📊 Row Counts:`, 'blue')
      for (const table of tables) {
        try {
          const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get()
          result.counts[table.name] = count.count
          log(`   ${table.name}: ${count.count.toLocaleString()} rows`, 'green')
        } catch (e) {
          result.counts[table.name] = 'ERROR'
          result.errors.push(`Cannot count ${table.name}: ${e.message}`)
          log(`   ${table.name}: ❌ ${e.message}`, 'red')
        }
      }
    } catch (e) {
      result.errors.push(`Cannot read tables: ${e.message}`)
      log(`   ❌ Cannot read tables: ${e.message}`, 'red')
    }
    
    // Integrity check
    log(`\n🔍 Integrity Check:`, 'blue')
    try {
      const integrity = db.pragma('integrity_check')
      if (integrity.length === 1 && integrity[0].integrity_check === 'ok') {
        log(`   ✅ Database integrity: OK`, 'green')
        result.success = true
        result.recoverable = true
      } else {
        log(`   ⚠️  Database has issues:`, 'yellow')
        integrity.slice(0, 10).forEach(issue => {
          log(`      - ${issue.integrity_check}`, 'yellow')
          result.errors.push(issue.integrity_check)
        })
        if (integrity.length > 10) {
          log(`      ... and ${integrity.length - 10} more issues`, 'yellow')
        }
        result.recoverable = integrity.length < 100 // Recoverable if not too many errors
      }
    } catch (e) {
      result.errors.push(`Integrity check failed: ${e.message}`)
      log(`   ❌ Integrity check failed: ${e.message}`, 'red')
    }
    
    // Sample data (if possible)
    if (result.tables.includes('emails')) {
      log(`\n📧 Sample Emails (newest 5):`, 'blue')
      try {
        const samples = db.prepare(`
          SELECT id, from_address, to_address, subject, timestamp 
          FROM emails 
          ORDER BY timestamp DESC 
          LIMIT 5
        `).all()
        
        samples.forEach((email, i) => {
          log(`   ${i + 1}. ${email.subject || '(No subject)'}`)
          log(`      From: ${email.from_address}`)
          log(`      To: ${email.to_address}`)
          log(`      Time: ${email.timestamp}`)
        })
      } catch (e) {
        log(`   ❌ Cannot read sample emails: ${e.message}`, 'red')
      }
    }
    
  } catch (e) {
    result.errors.push(`Cannot open database: ${e.message}`)
    log(`\n❌ CRITICAL ERROR: ${e.message}`, 'red')
    log(`   Error Code: ${e.code}`, 'red')
    
    if (e.code === 'SQLITE_CORRUPT') {
      log(`\n💡 Database is CORRUPTED! Recovery options:`, 'yellow')
      log(`   1. Use .recover command (SQLite 3.37+)`)
      log(`   2. Try dumping partial data`)
      log(`   3. Restore from backup`)
    }
  } finally {
    if (db) {
      try {
        db.close()
      } catch (e) {
        log(`   ⚠️  Error closing database: ${e.message}`, 'yellow')
      }
    }
  }
  
  return result
}

function generateRecoveryPlan(results) {
  log(`\n${'='.repeat(70)}`, 'cyan')
  log(`🎯 RECOVERY PLAN`, 'bold')
  log('='.repeat(70), 'cyan')
  
  let canRecover = false
  
  for (const [dbName, result] of Object.entries(results)) {
    log(`\n📁 ${dbName}:`, 'blue')
    
    if (result.success) {
      log(`   ✅ Database is HEALTHY - No action needed`, 'green')
      canRecover = true
    } else if (result.canOpen && result.recoverable) {
      log(`   ⚠️  Database has issues but RECOVERABLE`, 'yellow')
      log(`   Recommended: Export data and create new database`)
      canRecover = true
    } else if (result.canOpen) {
      log(`   ❌ Database is CORRUPTED - Partial recovery possible`, 'red')
      log(`   Try: Export readable tables to CSV`)
    } else {
      log(`   💀 Database is SEVERELY CORRUPTED - Cannot open`, 'red')
      log(`   Last resort: Use sqlite3 .recover command`)
    }
    
    if (result.errors.length > 0) {
      log(`\n   Errors found:`, 'yellow')
      result.errors.slice(0, 5).forEach(err => {
        log(`      - ${err}`, 'yellow')
      })
      if (result.errors.length > 5) {
        log(`      ... and ${result.errors.length - 5} more errors`, 'yellow')
      }
    }
  }
  
  log(`\n${'='.repeat(70)}`, 'cyan')
  log(`📝 NEXT STEPS:`, 'bold')
  log('='.repeat(70), 'cyan')
  
  if (canRecover) {
    log(`\n✅ Good news! Your databases can be recovered.`)
    log(`\n1. Use Database_test backup (SAFEST):`)
    log(`   - Copy cleaned databases from Database_test/ to production`)
    log(`   - Already optimized and tested`)
    log(`\n2. Or export/import data:`)
    log(`   - Export to CSV/SQL from corrupted DB`)
    log(`   - Create new database`)
    log(`   - Import data`)
  } else {
    log(`\n⚠️  Databases are heavily corrupted!`)
    log(`\n1. Check if you have Database_test backup:`)
    log(`   - Files were cleaned and VACUUMed`)
    log(`   - Use those instead`)
    log(`\n2. Or start fresh:`)
    log(`   - Delete corrupted databases`)
    log(`   - Restart container to create new ones`)
    log(`   - You'll lose all emails (but system works)`)
  }
}

// Main
console.log('\n🔬 SQLite DATABASE CORRUPTION ANALYZER\n')

const dbFolder = process.argv[2] || '.'
log(`Analyzing databases in: ${path.resolve(dbFolder)}`, 'cyan')

const results = {}
const dbFiles = ['emails.db', 'auth.db']

for (const dbFile of dbFiles) {
  const dbPath = path.join(dbFolder, dbFile)
  results[dbFile] = analyzeDatabase(dbPath, dbFile)
}

generateRecoveryPlan(results)

log(`\n✅ Analysis complete!\n`, 'green')
