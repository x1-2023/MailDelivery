#!/usr/bin/env node
"use strict"
// Reduce emails so each account (to_address) keeps only 1 email.
// Behavior:
//  - For each distinct to_address, if there are > 1 emails, keep exactly one:
//      * If there are starred emails -> keep newest starred
//      * Else keep newest overall
//  - Remove attachments for deleted emails
//  - Operates inside a transaction for each account (or in batches) to avoid partial state
//  - Options: --db <path>, --backup, --dry-run, --limit <N> (process only first N accounts)

const fs = require('fs')
const path = require('path')
const Database = require('better-sqlite3')

function usage() {
  console.log(`Usage: node reduce-to-one-per-account.js [--db PATH] [--backup] [--dry-run] [--limit N]`)
}

// Parse args
const args = process.argv.slice(2)
let dbPath = path.join(process.cwd(), 'data', 'emails.db')
let doBackup = false
let dryRun = false
let limit = null

for (let i = 0; i < args.length; i++) {
  const a = args[i]
  if (a === '--db' && args[i+1]) { dbPath = args[i+1]; i++ }
  else if (a === '--backup') doBackup = true
  else if (a === '--dry-run') dryRun = true
  else if (a === '--limit' && args[i+1]) { limit = parseInt(args[i+1], 10); i++ }
  else if (a === '--help' || a === '-h') { usage(); process.exit(0) }
}

if (!fs.existsSync(dbPath)) {
  console.error('emails.db not found at', dbPath)
  process.exit(2)
}

if (doBackup) {
  const backupPath = `${dbPath}.bak.${new Date().toISOString().replace(/[:.]/g,'-')}`
  console.log('Creating backup:', backupPath)
  fs.copyFileSync(dbPath, backupPath)
}

const db = new Database(dbPath, { timeout: 30000 })
try {
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 30000')
} catch (e) {
  console.warn('Warning setting pragmas:', e && e.message)
}

// Prepare statements
const getAccountsStmt = db.prepare(`SELECT to_address as email, COUNT(*) as cnt FROM emails GROUP BY to_address ORDER BY cnt DESC`)
const getEmailsForAccountStmt = db.prepare(`SELECT id, created_at, timestamp, starred FROM emails WHERE to_address = ? ORDER BY datetime(timestamp) DESC, datetime(created_at) DESC`)
const deleteAttachmentsStmt = db.prepare(`DELETE FROM attachments WHERE email_id = ?`)
const deleteEmailsStmt = db.prepare(`DELETE FROM emails WHERE id = ?`)

// Wrap per-account transaction
const processAccount = db.transaction((accountEmail) => {
  const rows = getEmailsForAccountStmt.all(accountEmail)
  if (!rows || rows.length <= 1) return { kept: rows.length, deleted: 0 }

  // Determine keep id
  let keepId = null

  // Prefer newest starred
  const starred = rows.find(r => r.starred === 1 || r.starred === '1')
  if (starred) keepId = starred.id
  else keepId = rows[0].id // rows ordered newest first

  let deleted = 0
  for (const r of rows) {
    if (r.id === keepId) continue
    // delete attachments then email
    deleteAttachmentsStmt.run(r.id)
    deleteEmailsStmt.run(r.id)
    deleted++
  }

  return { kept: 1, deleted }
})

function run() {
  const accounts = getAccountsStmt.all()
  const totalAccounts = accounts.length
  console.log(`Found ${totalAccounts} accounts with emails`)

  let processed = 0
  let totalDeleted = 0

  for (const acc of accounts) {
    if (limit && processed >= limit) break
    const email = acc.email
    const cnt = acc.cnt
    if (cnt <= 1) {
      processed++
      continue
    }

    if (dryRun) {
      // Just show what would be done
      const rows = getEmailsForAccountStmt.all(email)
      let keepId = null
      const starred = rows.find(r => r.starred === 1 || r.starred === '1')
      if (starred) keepId = starred.id
      else keepId = rows[0].id

      console.log(`[DRY RUN] ${email}: ${cnt} -> keep ${keepId}, would delete ${cnt - 1}`)
      processed++
      continue
    }

    try {
      const res = processAccount(email)
      totalDeleted += res.deleted
      processed++
      if (processed % 100 === 0) {
        console.log(`Processed ${processed}/${totalAccounts} accounts, deleted so far ${totalDeleted} emails`)
      }
    } catch (err) {
      console.error('Error processing account', email, err && err.message)
    }
  }

  console.log(`Completed. Processed ${processed} accounts. Total deleted emails: ${totalDeleted}`)
}

try {
  run()
} finally {
  try { db.close() } catch (e) {}
}

// Exit code 0
process.exit(0)
