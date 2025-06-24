import { Database } from "./database"
import fs from "fs"
import path from "path"

const db = new Database()

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
  // Total emails
  const totalEmailsResult = await db.get("SELECT COUNT(*) as count FROM emails")
  const totalEmails = totalEmailsResult?.count || 0

  // Total accounts
  const totalAccountsResult = await db.get("SELECT COUNT(DISTINCT to_address) as count FROM emails")
  const totalAccounts = totalAccountsResult?.count || 0

  // Emails today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const emailsTodayResult = await db.get("SELECT COUNT(*) as count FROM emails WHERE timestamp >= ?", [
    today.toISOString(),
  ])
  const emailsToday = emailsTodayResult?.count || 0

  // Emails this week
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const emailsThisWeekResult = await db.get("SELECT COUNT(*) as count FROM emails WHERE timestamp >= ?", [
    weekAgo.toISOString(),
  ])
  const emailsThisWeek = emailsThisWeekResult?.count || 0

  // Storage used
  const storageUsed = await calculateStorageUsed()

  // Oldest and newest emails
  const oldestEmailResult = await db.get("SELECT timestamp FROM emails ORDER BY timestamp ASC LIMIT 1")
  const newestEmailResult = await db.get("SELECT timestamp FROM emails ORDER BY timestamp DESC LIMIT 1")

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

export async function getAllEmailAccountsWithStats(): Promise<EmailAccount[]> {
  const accounts = await db.all(`
    SELECT 
      to_address as email,
      COUNT(*) as emailCount,
      MAX(timestamp) as lastActivity,
      SUM(LENGTH(body) + LENGTH(COALESCE(html, ''))) as storageBytes
    FROM emails 
    GROUP BY to_address 
    ORDER BY lastActivity DESC
  `)

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
  const deleteOlderThanDays = Number.parseInt(process.env.DELETE_OLDER_THAN_DAYS || "1")
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - deleteOlderThanDays)

  // Delete old emails
  const result = await db.run("DELETE FROM emails WHERE timestamp < ?", [cutoffDate.toISOString()])

  // Delete expired temp emails
  await db.run("DELETE FROM temp_emails WHERE expires_at < ?", [new Date().toISOString()])

  // Delete orphaned attachments
  await db.run(`
    DELETE FROM attachments 
    WHERE email_id NOT IN (SELECT id FROM emails)
  `)

  return { deletedCount: result.changes || 0 }
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
