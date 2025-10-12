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

// Admin authentication middleware
export async function requireAdmin(request: Request): Promise<{ user?: any; error?: Response }> {
  const { NextResponse } = await import("next/server")
  
  try {
    // Get session token from cookies
    const cookieHeader = request.headers.get("cookie")
    if (!cookieHeader) {
      return {
        error: NextResponse.json(
          { error: "Unauthorized", message: "No session token" },
          { status: 401 }
        ),
      }
    }

    // Parse cookie to get session_token
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((c) => {
        const [key, ...v] = c.split("=")
        return [key, v.join("=")]
      })
    )

    const sessionToken = cookies.session_token
    if (!sessionToken) {
      return {
        error: NextResponse.json(
          { error: "Unauthorized", message: "No session token" },
          { status: 401 }
        ),
      }
    }

    // Verify session and get user
    const session = await db.get(
      "SELECT * FROM sessions WHERE token = ? AND expires_at > datetime('now')",
      [sessionToken]
    )

    if (!session) {
      return {
        error: NextResponse.json(
          { error: "Unauthorized", message: "Invalid or expired session" },
          { status: 401 }
        ),
      }
    }

    // Get user
    const user = await db.get("SELECT * FROM users WHERE id = ?", [session.user_id])

    if (!user) {
      return {
        error: NextResponse.json(
          { error: "Unauthorized", message: "User not found" },
          { status: 401 }
        ),
      }
    }

    // Check if user is admin
    if (user.role !== "admin") {
      return {
        error: NextResponse.json(
          { error: "Forbidden", message: "Admin access required" },
          { status: 403 }
        ),
      }
    }

    // Check if account is active
    if (!user.is_active) {
      return {
        error: NextResponse.json(
          { error: "Forbidden", message: "Account is deactivated" },
          { status: 403 }
        ),
      }
    }

    return { user }
  } catch (error) {
    console.error("Admin auth error:", error)
    return {
      error: NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      ),
    }
  }
}
