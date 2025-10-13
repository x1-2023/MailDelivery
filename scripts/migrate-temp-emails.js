/**
 * Migration Script: Move temp_emails from emails.db to auth.db
 * 
 * This script migrates the temp_emails table from emails.db to auth.db
 * to avoid database lock conflicts between async (sqlite) and sync (better-sqlite3) libraries.
 * 
 * Run this ONCE before deploying the new version.
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const isProduction = process.env.NODE_ENV === 'production';
const dataDir = isProduction 
  ? '/var/www/opentrashmail/data'
  : path.join(process.cwd(), 'data');

const emailsDbPath = path.join(dataDir, 'emails.db');
const authDbPath = path.join(dataDir, 'auth.db');

console.log('🔄 Starting temp_emails migration...');
console.log(`Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`Data directory: ${dataDir}`);

// Check if emails.db exists
if (!fs.existsSync(emailsDbPath)) {
  console.log('⚠️  emails.db not found - nothing to migrate');
  process.exit(0);
}

try {
  // Open both databases
  console.log('📂 Opening databases...');
  const emailsDb = new Database(emailsDbPath, { readonly: false });
  const authDb = new Database(authDbPath, { readonly: false });

  // Enable WAL mode for both
  emailsDb.pragma('journal_mode = WAL');
  authDb.pragma('journal_mode = WAL');

  // Check if temp_emails exists in emails.db
  const tables = emailsDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='temp_emails'").all();
  
  if (tables.length === 0) {
    console.log('✅ temp_emails table not found in emails.db - already migrated or never existed');
    emailsDb.close();
    authDb.close();
    process.exit(0);
  }

  // Get count of records
  const countResult = emailsDb.prepare("SELECT COUNT(*) as count FROM temp_emails").get();
  const recordCount = countResult.count;
  
  console.log(`📊 Found ${recordCount} temp_emails records to migrate`);

  if (recordCount === 0) {
    console.log('✅ No records to migrate - dropping empty table');
    emailsDb.prepare("DROP TABLE IF EXISTS temp_emails").run();
    emailsDb.close();
    authDb.close();
    process.exit(0);
  }

  // Create temp_emails table in auth.db if not exists
  console.log('📝 Creating temp_emails table in auth.db...');
  authDb.exec(`
    CREATE TABLE IF NOT EXISTS temp_emails (
      email TEXT PRIMARY KEY,
      domain TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      user_id TEXT,
      is_anonymous INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_temp_emails_expires ON temp_emails(expires_at);
    CREATE INDEX IF NOT EXISTS idx_temp_emails_user ON temp_emails(user_id);
  `);

  // Migrate data
  console.log('🔄 Migrating records...');
  const tempEmails = emailsDb.prepare("SELECT * FROM temp_emails").all();
  
  const insertStmt = authDb.prepare(`
    INSERT OR REPLACE INTO temp_emails (email, domain, expires_at, user_id, is_anonymous, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  let migratedCount = 0;
  const transaction = authDb.transaction((records) => {
    for (const record of records) {
      insertStmt.run(
        record.email,
        record.domain,
        record.expires_at,
        record.user_id || null,
        record.is_anonymous ?? 1,
        record.created_at || new Date().toISOString()
      );
      migratedCount++;
    }
  });

  transaction(tempEmails);
  console.log(`✅ Migrated ${migratedCount} records to auth.db`);

  // Verify migration
  const verifyCount = authDb.prepare("SELECT COUNT(*) as count FROM temp_emails").get();
  console.log(`✅ Verified: ${verifyCount.count} records in auth.db`);

  // Drop temp_emails table from emails.db
  console.log('🗑️  Dropping temp_emails table from emails.db...');
  emailsDb.prepare("DROP TABLE IF EXISTS temp_emails").run();
  
  // Also drop the index
  emailsDb.prepare("DROP INDEX IF EXISTS idx_temp_emails_expires").run();

  console.log('✅ Migration completed successfully!');
  console.log(`
Summary:
- Migrated: ${migratedCount} records
- Source: emails.db (table dropped)
- Target: auth.db (table created)
  `);

  // Close databases
  emailsDb.close();
  authDb.close();

} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}
