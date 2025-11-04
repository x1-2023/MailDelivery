const Database = require('better-sqlite3')
const path = require('path')

console.log('\n' + '='.repeat(80))
console.log('📊 SAMPLE DATA FROM CLEANED DATABASES')
console.log('='.repeat(80))

// AUTH.DB
console.log('\n🔐 AUTH.DB SAMPLE DATA\n')

const authDb = new Database(path.join(process.cwd(), 'Database_test', 'auth.db'), { readonly: true })

// Users
console.log('👥 USERS (showing first 5):')
console.log('-'.repeat(80))
const users = authDb.prepare('SELECT id, username, role, is_active, email, created_at FROM users LIMIT 5').all()
users.forEach(u => {
  console.log(`  ${u.username} (${u.role})`)
  console.log(`    ID: ${u.id}`)
  console.log(`    Email: ${u.email || 'N/A'}`)
  console.log(`    Active: ${u.is_active === 1 ? 'Yes' : 'No'}`)
  console.log(`    Created: ${u.created_at}`)
  console.log()
})

// Temp Emails (sample)
console.log('📧 TEMP EMAILS (showing random 10):')
console.log('-'.repeat(80))
const tempEmails = authDb.prepare(`
  SELECT email, domain, user_id, is_anonymous, expires_at, created_at 
  FROM temp_emails 
  ORDER BY RANDOM() 
  LIMIT 10
`).all()
tempEmails.forEach((t, i) => {
  console.log(`  ${i+1}. ${t.email}`)
  console.log(`     Domain: ${t.domain}`)
  console.log(`     User: ${t.user_id || 'Anonymous'}`)
  console.log(`     Expires: ${t.expires_at}`)
  console.log()
})

// Sessions
console.log('🔑 ACTIVE SESSIONS:')
console.log('-'.repeat(80))
const sessions = authDb.prepare(`
  SELECT s.id, s.user_id, u.username, s.expires_at, s.created_at 
  FROM sessions s
  JOIN users u ON s.user_id = u.id
  WHERE s.expires_at > datetime('now')
  LIMIT 5
`).all()
if (sessions.length > 0) {
  sessions.forEach(s => {
    console.log(`  User: ${s.username}`)
    console.log(`  Session ID: ${s.id}`)
    console.log(`  Expires: ${s.expires_at}`)
    console.log()
  })
} else {
  console.log('  No active sessions\n')
}

authDb.close()

// EMAILS.DB
console.log('='.repeat(80))
console.log('\n📨 EMAILS.DB SAMPLE DATA\n')

const emailsDb = new Database(path.join(process.cwd(), 'Database_test', 'emails.db'), { readonly: true })

// Stats
console.log('📊 STATISTICS:')
console.log('-'.repeat(80))
const stats = {
  totalEmails: emailsDb.prepare('SELECT COUNT(*) as c FROM emails').get().c,
  totalAccounts: emailsDb.prepare('SELECT COUNT(DISTINCT to_address) as c FROM emails').get().c,
  starredEmails: emailsDb.prepare('SELECT COUNT(*) as c FROM emails WHERE starred = 1').get().c,
  readEmails: emailsDb.prepare('SELECT COUNT(*) as c FROM emails WHERE read = 1').get().c,
  attachments: emailsDb.prepare('SELECT COUNT(*) as c FROM attachments').get().c,
  spamFilters: emailsDb.prepare('SELECT COUNT(*) as c FROM spam_filters').get().c
}
console.log(`  Total Emails: ${stats.totalEmails.toLocaleString()}`)
console.log(`  Total Accounts: ${stats.totalAccounts.toLocaleString()}`)
console.log(`  Starred: ${stats.starredEmails}`)
console.log(`  Read: ${stats.readEmails}`)
console.log(`  Attachments: ${stats.attachments}`)
console.log(`  Spam Filters: ${stats.spamFilters}`)

// Sample emails
console.log('\n📬 SAMPLE EMAILS (showing 5 newest):')
console.log('-'.repeat(80))
const emails = emailsDb.prepare(`
  SELECT id, from_address, to_address, subject, timestamp, read, starred, 
         LENGTH(body) as body_length, spam_filtered
  FROM emails 
  ORDER BY timestamp DESC 
  LIMIT 5
`).all()

emails.forEach((e, i) => {
  console.log(`\n  ${i+1}. ${e.subject || '(No subject)'}`)
  console.log(`     From: ${e.from_address}`)
  console.log(`     To: ${e.to_address}`)
  console.log(`     Time: ${e.timestamp}`)
  console.log(`     Body: ${e.body_length} bytes`)
  console.log(`     Status: ${e.read ? '✓ Read' : '○ Unread'}${e.starred ? ' ⭐ Starred' : ''}${e.spam_filtered ? ' 🚫 Spam' : ''}`)
})

// Top senders
console.log('\n\n📤 TOP 10 SENDERS:')
console.log('-'.repeat(80))
const topSenders = emailsDb.prepare(`
  SELECT from_address, COUNT(*) as count 
  FROM emails 
  GROUP BY from_address 
  ORDER BY count DESC 
  LIMIT 10
`).all()
topSenders.forEach((s, i) => {
  console.log(`  ${i+1}. ${s.from_address}: ${s.count} emails`)
})

// Top domains
console.log('\n📮 TOP 10 RECIPIENT DOMAINS:')
console.log('-'.repeat(80))
const topDomains = emailsDb.prepare(`
  SELECT 
    SUBSTR(to_address, INSTR(to_address, '@') + 1) as domain,
    COUNT(*) as count 
  FROM emails 
  WHERE to_address LIKE '%@%'
  GROUP BY domain 
  ORDER BY count DESC 
  LIMIT 10
`).all()
topDomains.forEach((d, i) => {
  console.log(`  ${i+1}. @${d.domain}: ${d.count} emails`)
})

// Recent activity
console.log('\n⏰ RECENT ACTIVITY (last 24 hours):')
console.log('-'.repeat(80))
const recentCount = emailsDb.prepare(`
  SELECT COUNT(*) as c 
  FROM emails 
  WHERE timestamp > datetime('now', '-1 day')
`).get().c
console.log(`  Emails received in last 24h: ${recentCount}`)

// Oldest and newest
const oldest = emailsDb.prepare('SELECT timestamp FROM emails ORDER BY timestamp ASC LIMIT 1').get()
const newest = emailsDb.prepare('SELECT timestamp FROM emails ORDER BY timestamp DESC LIMIT 1').get()
console.log(`  Oldest email: ${oldest?.timestamp || 'N/A'}`)
console.log(`  Newest email: ${newest?.timestamp || 'N/A'}`)

emailsDb.close()

// Storage info
console.log('\n='.repeat(80))
console.log('💾 STORAGE INFO\n')
const fs = require('fs')
const authStats = fs.statSync(path.join(process.cwd(), 'Database_test', 'auth.db'))
const emailsStats = fs.statSync(path.join(process.cwd(), 'Database_test', 'emails.db'))
const backupStats = fs.existsSync(path.join(process.cwd(), 'Database_test', 'emails.db.bak.2025-11-04T10-35-52-423Z'))
  ? fs.statSync(path.join(process.cwd(), 'Database_test', 'emails.db.bak.2025-11-04T10-35-52-423Z'))
  : null

console.log(`auth.db:         ${(authStats.size / 1024 / 1024).toFixed(2)} MB`)
console.log(`emails.db:       ${(emailsStats.size / 1024 / 1024).toFixed(2)} MB (cleaned)`)
if (backupStats) {
  console.log(`emails.db.bak:   ${(backupStats.size / 1024 / 1024).toFixed(2)} MB (backup before cleanup)`)
}
console.log(`\nTotal:           ${((authStats.size + emailsStats.size) / 1024 / 1024).toFixed(2)} MB`)

console.log('\n='.repeat(80))
console.log('✅ Sample data displayed successfully!')
console.log('='.repeat(80) + '\n')
