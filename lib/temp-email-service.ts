/**
 * Temp Email Service - Dual Database Support
 * 
 * This service manages temp_emails across TWO databases:
 * 1. auth.db (NEW) - All WRITE operations go here (better-sqlite3 sync)
 * 2. emails.db (OLD) - READ-ONLY for historical data access
 * 
 * Why? To avoid SQLITE_BUSY conflicts while preserving old data access.
 */

import Database from "better-sqlite3"
import path from "path"
import fs from "fs"
import { 
  createOrUpdateTempEmail, 
  deleteTempEmail as deleteFromAuthDb,
  deleteExpiredTempEmails as deleteExpiredFromAuthDb,
  getTempEmail as getTempEmailFromAuthDb,
  getAllTempEmails as getAllFromAuthDb,
  type TempEmailRecord 
} from "./auth-database"

// Lazy-load emails.db for READ-ONLY access
let emailsDb: Database.Database | null = null

function getEmailsDb(): Database.Database {
  if (emailsDb) return emailsDb

  const dbPath = process.env.NODE_ENV === "production"
    ? "/var/www/opentrashmail/data/emails.db"
    : path.join(process.cwd(), "data", "emails.db")

  if (!fs.existsSync(dbPath)) {
    console.warn("emails.db not found - skipping old data access")
    // Return a dummy database that returns empty results
    return null as any
  }

  emailsDb = new Database(dbPath, {
    readonly: true, // READ-ONLY mode
    fileMustExist: false
  })

  emailsDb.pragma("journal_mode = WAL")
  emailsDb.pragma("query_only = ON") // Extra safety - no writes

  return emailsDb
}

/**
 * Get temp email from BOTH databases (auth.db priority)
 */
export function getTempEmail(email: string): TempEmailRecord | undefined {
  // Try auth.db first (NEW data)
  const newData = getTempEmailFromAuthDb(email)
  if (newData) return newData

  // Fallback to emails.db (OLD data) - READ-ONLY
  try {
    const db = getEmailsDb()
    if (!db) return undefined

    const stmt = db.prepare("SELECT * FROM temp_emails WHERE email = ?")
    const oldData = stmt.get(email) as any
    
    if (oldData) {
      return {
        email: oldData.email,
        domain: oldData.domain,
        expires_at: oldData.expires_at,
        user_id: oldData.user_id || null,
        is_anonymous: oldData.is_anonymous ?? 1,
        created_at: oldData.created_at
      }
    }
  } catch (error) {
    console.error("Error reading from emails.db:", error)
  }

  return undefined
}

/**
 * Get ALL temp emails from BOTH databases
 * Merges data with auth.db taking priority for duplicates
 */
export function getAllTempEmails(): TempEmailRecord[] {
  const results = new Map<string, TempEmailRecord>()

  // First load OLD data from emails.db
  try {
    const db = getEmailsDb()
    if (db) {
      const stmt = db.prepare("SELECT * FROM temp_emails ORDER BY created_at DESC")
      const oldData = stmt.all() as any[]
      
      for (const row of oldData) {
        results.set(row.email, {
          email: row.email,
          domain: row.domain,
          expires_at: row.expires_at,
          user_id: row.user_id || null,
          is_anonymous: row.is_anonymous ?? 1,
          created_at: row.created_at
        })
      }
    }
  } catch (error) {
    console.error("Error reading old temp_emails:", error)
  }

  // Then load NEW data from auth.db (overwrites duplicates)
  const newData = getAllFromAuthDb()
  for (const record of newData) {
    results.set(record.email, record)
  }

  return Array.from(results.values()).sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

/**
 * Get temp emails by user from BOTH databases
 */
export function getTempEmailsByUser(userId: string): TempEmailRecord[] {
  const results = new Map<string, TempEmailRecord>()

  // OLD data
  try {
    const db = getEmailsDb()
    if (db) {
      const stmt = db.prepare("SELECT * FROM temp_emails WHERE user_id = ? ORDER BY created_at DESC")
      const oldData = stmt.all(userId) as any[]
      
      for (const row of oldData) {
        results.set(row.email, {
          email: row.email,
          domain: row.domain,
          expires_at: row.expires_at,
          user_id: row.user_id || null,
          is_anonymous: row.is_anonymous ?? 1,
          created_at: row.created_at
        })
      }
    }
  } catch (error) {
    console.error("Error reading old user emails:", error)
  }

  // NEW data
  try {
    const authDb = require("./auth-database").authDb
    const stmt = authDb.prepare("SELECT * FROM temp_emails WHERE user_id = ? ORDER BY created_at DESC")
    const newData = stmt.all(userId) as TempEmailRecord[]
    
    for (const record of newData) {
      results.set(record.email, record)
    }
  } catch (error) {
    console.error("Error reading new user emails:", error)
  }

  return Array.from(results.values()).sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

/**
 * Get anonymous temp emails from BOTH databases
 */
export function getAnonymousTempEmails(): TempEmailRecord[] {
  const results = new Map<string, TempEmailRecord>()

  // OLD data
  try {
    const db = getEmailsDb()
    if (db) {
      const stmt = db.prepare("SELECT * FROM temp_emails WHERE user_id IS NULL OR user_id = '' ORDER BY created_at DESC")
      const oldData = stmt.all() as any[]
      
      for (const row of oldData) {
        results.set(row.email, {
          email: row.email,
          domain: row.domain,
          expires_at: row.expires_at,
          user_id: null,
          is_anonymous: 1,
          created_at: row.created_at
        })
      }
    }
  } catch (error) {
    console.error("Error reading old anonymous emails:", error)
  }

  // NEW data
  try {
    const authDb = require("./auth-database").authDb
    const stmt = authDb.prepare("SELECT * FROM temp_emails WHERE user_id IS NULL OR user_id = '' ORDER BY created_at DESC")
    const newData = stmt.all() as TempEmailRecord[]
    
    for (const record of newData) {
      results.set(record.email, record)
    }
  } catch (error) {
    console.error("Error reading new anonymous emails:", error)
  }

  return Array.from(results.values()).sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

/**
 * Count temp emails in BOTH databases
 */
export function countTempEmails(): { total: number; auth: number; emails: number } {
  let authCount = 0
  let emailsCount = 0

  // Count in auth.db
  try {
    const authDb = require("./auth-database").authDb
    const result = authDb.prepare("SELECT COUNT(*) as count FROM temp_emails").get() as any
    authCount = result?.count || 0
  } catch (error) {
    console.error("Error counting auth temp_emails:", error)
  }

  // Count in emails.db
  try {
    const db = getEmailsDb()
    if (db) {
      const result = db.prepare("SELECT COUNT(*) as count FROM temp_emails").get() as any
      emailsCount = result?.count || 0
    }
  } catch (error) {
    console.error("Error counting old temp_emails:", error)
  }

  // Get unique count by fetching all and deduplicating
  const allEmails = getAllTempEmails()

  return {
    total: allEmails.length, // Deduplicated count
    auth: authCount,         // Count in auth.db
    emails: emailsCount      // Count in emails.db (old)
  }
}

/**
 * CREATE temp email - WRITES to auth.db ONLY
 */
export function createTempEmail(
  email: string, 
  domain: string, 
  expires_at: string, 
  user_id?: string | null, 
  is_anonymous: number = 1
): TempEmailRecord {
  return createOrUpdateTempEmail(email, domain, expires_at, user_id, is_anonymous)
}

/**
 * DELETE temp email - Deletes from auth.db ONLY
 * Note: Old data in emails.db remains (READ-ONLY)
 */
export function deleteTempEmail(email: string): boolean {
  return deleteFromAuthDb(email)
}

/**
 * DELETE expired temp emails - Deletes from auth.db ONLY
 */
export function deleteExpiredTempEmails(): number {
  return deleteExpiredFromAuthDb()
}

/**
 * Check if email exists in EITHER database
 */
export function tempEmailExists(email: string): boolean {
  return getTempEmail(email) !== undefined
}

/**
 * Get database statistics
 */
export function getDatabaseStats(): {
  auth_db: { path: string; size: string; temp_emails_count: number }
  emails_db: { path: string; size: string; temp_emails_count: number }
  total_unique: number
} {
  const counts = countTempEmails()

  const authDbPath = process.env.NODE_ENV === "production"
    ? "/var/www/opentrashmail/data/auth.db"
    : path.join(process.cwd(), "data", "auth.db")

  const emailsDbPath = process.env.NODE_ENV === "production"
    ? "/var/www/opentrashmail/data/emails.db"
    : path.join(process.cwd(), "data", "emails.db")

  const getFileSize = (filePath: string): string => {
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath)
        const mb = stats.size / (1024 * 1024)
        return `${mb.toFixed(2)} MB`
      }
    } catch {}
    return "N/A"
  }

  return {
    auth_db: {
      path: authDbPath,
      size: getFileSize(authDbPath),
      temp_emails_count: counts.auth
    },
    emails_db: {
      path: emailsDbPath,
      size: getFileSize(emailsDbPath),
      temp_emails_count: counts.emails
    },
    total_unique: counts.total
  }
}

/**
 * Close databases (for cleanup)
 */
export function closeDatabases(): void {
  if (emailsDb) {
    try {
      emailsDb.close()
      emailsDb = null
    } catch (error) {
      console.error("Error closing emails.db:", error)
    }
  }
}
