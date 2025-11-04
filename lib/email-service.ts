import { Database } from "./database"
import { 
  createTempEmail as createTempEmailDual, 
  deleteTempEmail as deleteTempEmailDual, 
  deleteExpiredTempEmails as deleteExpiredDual 
} from "./temp-email-service"

// Database singleton
let db: Database | null = null
let dbInitPromise: Promise<Database> | null = null

async function getDb(): Promise<Database> {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    throw new Error('Database not available during build')
  }
  
  if (db) return db
  
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      const instance = new Database()
      await instance.init()
      db = instance
      return instance
    })()
  }
  
  return dbInitPromise
}

// Retry helper for database busy errors
async function retryOnBusy<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 5,
  baseDelay: number = 100
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      const isBusyError = error?.message?.includes('SQLITE_BUSY') || 
                          error?.code === 'SQLITE_BUSY'
      
      if (!isBusyError || attempt === maxRetries) {
        console.error(`${operationName} failed after ${attempt} attempts:`, error)
        throw error
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100
      console.warn(`${operationName} - SQLITE_BUSY, retry ${attempt}/${maxRetries} after ${delay}ms`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw new Error(`${operationName} failed after ${maxRetries} retries`)
}

export interface TempEmail {
  email: string
  domain: string
  expiresAt: string
  userId?: string
}

export interface Email {
  id: string
  from: string
  to: string
  subject: string
  body: string
  html?: string
  timestamp: string
  read: boolean
  starred: boolean
  spamFiltered?: number
  autoDeleteAt?: string
}

export function generateRandomEmail(domain: string): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${result}@${domain}`
}

/**
 * Create temp email - using dual-database service
 * WRITES to auth.db, can READ from both auth.db and emails.db
 * Supports both Anonymous (no userId) and Authenticated (with userId) modes
 */
export async function createTempEmail(tempEmail: TempEmail): Promise<TempEmail> {
  // Use dual-database service (WRITE to auth.db only)
  const isAnonymous = !tempEmail.userId
  createTempEmailDual(
    tempEmail.email,
    tempEmail.domain,
    tempEmail.expiresAt,
    tempEmail.userId || null,
    isAnonymous ? 1 : 0
  )
  
  return tempEmail
}

export async function getEmailsForAddress(email: string): Promise<Email[]> {
  // Try exact match first
  let rows = await (await getDb()).all("SELECT * FROM emails WHERE to_address = ? ORDER BY timestamp DESC", [email])
  
  // If no results, try searching with LIKE for emails that contain the address
  if (rows.length === 0) {
    rows = await (await getDb()).all("SELECT * FROM emails WHERE to_address LIKE ? ORDER BY timestamp DESC", [`%${email}%`])
  }

  return rows.map((row) => ({
    id: row.id,
    from: row.from_address,
    to: row.to_address,
    subject: row.subject,
    body: row.body,
    html: row.html,
    timestamp: row.timestamp,
    read: Boolean(row.read),
    starred: Boolean(row.starred),
  }))
}

export async function saveIncomingEmail(email: Omit<Email, "id">): Promise<void> {
  const id = generateId()
  
  await retryOnBusy(async () => {
    await (await getDb()).run(
      `INSERT INTO emails (id, from_address, to_address, subject, body, html, timestamp, read, starred, spam_filtered, auto_delete_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        email.from,
        email.to,
        email.subject,
        email.body,
        email.html,
        email.timestamp,
        0,
        0,
        email.spamFiltered || 0,
        email.autoDeleteAt || null,
      ],
    )
  }, `Save email from ${email.from} to ${email.to}`)
}

export async function deleteEmail(id: string): Promise<void> {
  await retryOnBusy(async () => {
    const db = await getDb()
    await db.run('BEGIN IMMEDIATE TRANSACTION')
    try {
      await db.run("DELETE FROM emails WHERE id = ?", [id])
      await db.run('COMMIT')
    } catch (error) {
      await db.run('ROLLBACK')
      throw error
    }
  }, `Delete email ${id}`)
}

export async function markEmailAsRead(id: string): Promise<void> {
  await retryOnBusy(async () => {
    await (await getDb()).run("UPDATE emails SET read = 1 WHERE id = ?", [id])
  }, `Mark email ${id} as read`)
}

export async function toggleEmailStar(id: string, starred: boolean): Promise<void> {
  await retryOnBusy(async () => {
    await (await getDb()).run("UPDATE emails SET starred = ? WHERE id = ?", [starred ? 1 : 0, id])
  }, `Toggle star for email ${id}`)
}

export async function cleanupExpiredEmails(): Promise<void> {
  const deleteOlderThanDays = Number.parseInt(process.env.DELETE_OLDER_THAN_DAYS || "1")
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - deleteOlderThanDays)

  await (await getDb()).run("DELETE FROM emails WHERE timestamp < ?", [cutoffDate.toISOString()])

  // Use dual-database service (deletes from auth.db only)
  deleteExpiredDual()
}

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export async function getRawEmail(email: string, id: string): Promise<{ raw: string } | null> {
  const row = await (await getDb()).get("SELECT raw FROM emails WHERE to_address = ? AND id = ?", [email, id])
  return row ? { raw: row.raw } : null
}

export async function getEmailAttachment(
  email: string,
  attachmentId: string,
): Promise<{
  data: Buffer
  mimeType: string
  filename: string
  size: number
} | null> {
  const row = await (await getDb()).get(
    `SELECT a.data, a.mime_type, a.filename, a.size 
     FROM attachments a 
     JOIN emails e ON a.email_id = e.id 
     WHERE e.to_address = ? AND a.id = ?`,
    [email, attachmentId],
  )

  if (!row) return null

  return {
    data: Buffer.from(row.data, "base64"),
    mimeType: row.mime_type,
    filename: row.filename,
    size: row.size,
  }
}

export async function deleteSpecificEmail(email: string, id: string): Promise<boolean> {
  return await retryOnBusy(async () => {
    const db = await getDb()
    
    // Use transaction to ensure atomicity
    await db.run('BEGIN IMMEDIATE TRANSACTION')
    
    try {
      // Delete email (attachments will CASCADE delete automatically)
      const result = await db.run("DELETE FROM emails WHERE to_address = ? AND id = ?", [email, id])
      
      await db.run('COMMIT')
      
      return (result.changes || 0) > 0
    } catch (error) {
      await db.run('ROLLBACK')
      console.error(`Failed to delete email ${id}:`, error)
      throw error
    }
  }, `Delete specific email ${id} for ${email}`)
}

export async function deleteAllEmailsForAccount(email: string): Promise<number> {
  return await retryOnBusy(async () => {
    const db = await getDb()
    
    // Use transaction to ensure atomicity
    await db.run('BEGIN IMMEDIATE TRANSACTION')
    
    try {
      // Delete all emails for this account
      // Attachments will be deleted automatically by CASCADE (if foreign_keys enabled)
      const result = await db.run("DELETE FROM emails WHERE to_address = ?", [email])
      
      // Delete temp email record - using dual-database service (deletes from auth.db only)
      // NOTE: This is in separate database, cannot be in same transaction
      deleteTempEmailDual(email)
      
      await db.run('COMMIT')
      
      return result.changes || 0
    } catch (error) {
      await db.run('ROLLBACK')
      console.error(`Failed to delete account ${email}:`, error)
      throw error
    }
  }, `Delete all emails for account ${email}`)
}

export async function getEmailsForAddressWithAttachments(email: string): Promise<(Email & { attachments?: any[] })[]> {
  // Try exact match first
  let rows = await (await getDb()).all(
    `
    SELECT e.*, 
           GROUP_CONCAT(a.id) as attachment_ids,
           GROUP_CONCAT(a.filename) as attachment_filenames,
           GROUP_CONCAT(a.mime_type) as attachment_mimes,
           GROUP_CONCAT(a.size) as attachment_sizes
    FROM emails e 
    LEFT JOIN attachments a ON e.id = a.email_id 
    WHERE e.to_address = ? 
    GROUP BY e.id 
    ORDER BY e.timestamp DESC
  `,
    [email],
  )

  // If no results, try searching with LIKE for emails that contain the address
  if (rows.length === 0) {
    rows = await (await getDb()).all(
      `
      SELECT e.*, 
             GROUP_CONCAT(a.id) as attachment_ids,
             GROUP_CONCAT(a.filename) as attachment_filenames,
             GROUP_CONCAT(a.mime_type) as attachment_mimes,
             GROUP_CONCAT(a.size) as attachment_sizes
      FROM emails e 
      LEFT JOIN attachments a ON e.id = a.email_id 
      WHERE e.to_address LIKE ? 
      GROUP BY e.id 
      ORDER BY e.timestamp DESC
    `,
      [`%${email}%`],
    )
  }

  return rows.map((row) => ({
    id: row.id,
    from: row.from_address,
    to: row.to_address,
    subject: row.subject,
    body: row.body,
    html: row.html,
    timestamp: row.timestamp,
    read: Boolean(row.read),
    starred: Boolean(row.starred),
    attachments: row.attachment_ids
      ? row.attachment_ids.split(",").map((id: string, index: number) => ({
          id,
          filename: row.attachment_filenames.split(",")[index],
          mimeType: row.attachment_mimes.split(",")[index],
          size: Number.parseInt(row.attachment_sizes.split(",")[index]),
        }))
      : [],
  }))
}

export async function getSpecificEmailWithAttachments(
  email: string,
  id: string,
): Promise<
  | (Email & {
      raw?: string
      attachments?: any[]
    })
  | null
> {
  const row = await (await getDb()).get(
    `
    SELECT e.*, 
           GROUP_CONCAT(a.id) as attachment_ids,
           GROUP_CONCAT(a.filename) as attachment_filenames,
           GROUP_CONCAT(a.mime_type) as attachment_mimes,
           GROUP_CONCAT(a.size) as attachment_sizes,
           GROUP_CONCAT(a.data) as attachment_data
    FROM emails e 
    LEFT JOIN attachments a ON e.id = a.email_id 
    WHERE e.to_address = ? AND e.id = ?
    GROUP BY e.id
  `,
    [email, id],
  )

  if (!row) return null

  return {
    id: row.id,
    from: row.from_address,
    to: row.to_address,
    subject: row.subject,
    body: row.body,
    html: row.html,
    raw: row.raw,
    timestamp: row.timestamp,
    read: Boolean(row.read),
    starred: Boolean(row.starred),
    attachments: row.attachment_ids
      ? row.attachment_ids.split(",").map((id: string, index: number) => ({
          id,
          filename: row.attachment_filenames.split(",")[index],
          mimeType: row.attachment_mimes.split(",")[index],
          size: Number.parseInt(row.attachment_sizes.split(",")[index]),
          data: row.attachment_data.split(",")[index], // base64 encoded
        }))
      : [],
  }
}

export async function getAllEmailAccounts(): Promise<string[]> {
  const rows = await (await getDb()).all("SELECT DISTINCT to_address FROM emails ORDER BY to_address")
  return rows.map((row) => row.to_address)
}

