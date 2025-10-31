import { Database } from "./database"
import { deleteExpiredTempEmails } from "./temp-email-service"
import fs from "fs"
import path from "path"

// Lazy initialization - only create database when actually needed (not during build)
let db: Database | null = null
let dbInitPromise: Promise<Database> | null = null

async function getDb(): Promise<Database> {
  // Skip database initialization during build time
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

export interface AdminStats {
  totalEmails: number
  totalAccounts: number
  emailsToday: number
  emailsThisWeek: number
  storageUsed: string
  oldestEmail: string
  newestEmail: string
}

export interface EmailAccount {
  email: string
  emailCount: number
  lastActivity: string
  storageUsed: string
}

export interface SystemConfig {
  deleteOlderThanDays: number
  maxEmailsPerAccount: number
  maxAttachmentSize: number
  allowedDomains: string[]
  autoCleanupEnabled: boolean
}

export async function getAdminStats(): Promise<AdminStats> {
  const database = await getDb()
  
  // Total emails
  const totalEmailsResult = await database.get("SELECT COUNT(*) as count FROM emails")
  const totalEmails = totalEmailsResult?.count || 0

  // Total accounts
  const totalAccountsResult = await database.get("SELECT COUNT(DISTINCT to_address) as count FROM emails")
  const totalAccounts = totalAccountsResult?.count || 0

  // Emails today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const emailsTodayResult = await database.get("SELECT COUNT(*) as count FROM emails WHERE timestamp >= ?", [
    today.toISOString(),
  ])
  const emailsToday = emailsTodayResult?.count || 0

  // Emails this week
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const emailsThisWeekResult = await database.get("SELECT COUNT(*) as count FROM emails WHERE timestamp >= ?", [
    weekAgo.toISOString(),
  ])
  const emailsThisWeek = emailsThisWeekResult?.count || 0

  // Storage used
  const storageUsed = await calculateStorageUsed()

  // Oldest and newest emails
  const oldestEmailResult = await database.get("SELECT timestamp FROM emails ORDER BY timestamp ASC LIMIT 1")
  const newestEmailResult = await database.get("SELECT timestamp FROM emails ORDER BY timestamp DESC LIMIT 1")

  return {
    totalEmails,
    totalAccounts,
    emailsToday,
    emailsThisWeek,
    storageUsed,
    oldestEmail: oldestEmailResult?.timestamp || "",
    newestEmail: newestEmailResult?.timestamp || "",
  }
}

export async function getAllEmailAccountsWithStats(limit: number = 100, offset: number = 0): Promise<EmailAccount[]> {
  const database = await getDb()
  const accounts = await database.all(`
    SELECT 
      to_address as email,
      COUNT(*) as emailCount,
      MAX(timestamp) as lastActivity,
      SUM(LENGTH(body) + LENGTH(COALESCE(html, ''))) as storageBytes
    FROM emails 
    GROUP BY to_address 
    ORDER BY lastActivity DESC
    LIMIT ? OFFSET ?
  `, [limit, offset])

  return accounts.map((account) => ({
    email: account.email,
    emailCount: account.emailCount,
    lastActivity: account.lastActivity,
    storageUsed: formatBytes(account.storageBytes || 0),
  }))
}

export async function getSystemConfig(): Promise<SystemConfig> {
  // Get config from environment variables and database
  const domains = process.env.DOMAINS?.split(",").map((d) => d.trim()) || ["tempmail.local"]

  return {
    deleteOlderThanDays: Number.parseInt(process.env.DELETE_OLDER_THAN_DAYS || "1"),
    maxEmailsPerAccount: 100, // Default value
    maxAttachmentSize: 20, // Default 20MB
    allowedDomains: domains,
    autoCleanupEnabled: true, // Default enabled
  }
}

export async function updateSystemConfig(updates: Partial<SystemConfig>): Promise<SystemConfig> {
  // In a real implementation, you'd save these to a config table or file
  // For now, we'll just return the updated config
  const currentConfig = await getSystemConfig()
  return { ...currentConfig, ...updates }
}

export async function runManualCleanup(): Promise<{ deletedCount: number }> {
  const database = await getDb()
  const deleteOlderThanDays = Number.parseInt(process.env.DELETE_OLDER_THAN_DAYS || "90")

  // Delete old emails using SQLite datetime function
  // Protect starred emails from deletion
  const result = await database.run(
    `DELETE FROM emails 
     WHERE created_at < datetime('now', '-' || ? || ' days')
       AND starred = 0`,
    [deleteOlderThanDays]
  )

  console.log(`🗑️ Deleted ${result.changes || 0} emails older than ${deleteOlderThanDays} days`)

  // Delete expired temp emails - using auth-database (in auth.db)
  const tempEmailsDeleted = deleteExpiredTempEmails()

  // Delete orphaned attachments
  await database.run(`
    DELETE FROM attachments 
    WHERE email_id NOT IN (SELECT id FROM emails)
  `)

  return { deletedCount: (result.changes || 0) + tempEmailsDeleted }
}

async function calculateStorageUsed(): Promise<string> {
  try {
    const dbPath =
      process.env.NODE_ENV === "production"
        ? "/var/www/opentrashmail/data/emails.db"
        : path.join(process.cwd(), "data", "emails.db")

    const stats = fs.statSync(dbPath)
    return formatBytes(stats.size)
  } catch (error) {
    return "0 MB"
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
