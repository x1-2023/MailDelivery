import { Database } from "./database"

export interface TempEmail {
  email: string
  domain: string
  expiresAt: string
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
}

const db = new Database()

export function generateRandomEmail(domain: string): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${result}@${domain}`
}

export async function createTempEmail(tempEmail: TempEmail): Promise<TempEmail> {
  await db.run("INSERT OR REPLACE INTO temp_emails (email, domain, expires_at) VALUES (?, ?, ?)", [
    tempEmail.email,
    tempEmail.domain,
    tempEmail.expiresAt,
  ])
  return tempEmail
}

export async function getEmailsForAddress(email: string): Promise<Email[]> {
  // Try exact match first
  let rows = await db.all("SELECT * FROM emails WHERE to_address = ? ORDER BY timestamp DESC", [email])
  
  // If no results, try searching with LIKE for emails that contain the address
  if (rows.length === 0) {
    rows = await db.all("SELECT * FROM emails WHERE to_address LIKE ? ORDER BY timestamp DESC", [`%${email}%`])
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
  await db.run(
    `INSERT INTO emails (id, from_address, to_address, subject, body, html, timestamp, read, starred) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, email.from, email.to, email.subject, email.body, email.html, email.timestamp, 0, 0],
  )
}

export async function deleteEmail(id: string): Promise<void> {
  await db.run("DELETE FROM emails WHERE id = ?", [id])
}

export async function markEmailAsRead(id: string): Promise<void> {
  await db.run("UPDATE emails SET read = 1 WHERE id = ?", [id])
}

export async function toggleEmailStar(id: string, starred: boolean): Promise<void> {
  await db.run("UPDATE emails SET starred = ? WHERE id = ?", [starred ? 1 : 0, id])
}

export async function cleanupExpiredEmails(): Promise<void> {
  const deleteOlderThanDays = Number.parseInt(process.env.DELETE_OLDER_THAN_DAYS || "1")
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - deleteOlderThanDays)

  await db.run("DELETE FROM emails WHERE timestamp < ?", [cutoffDate.toISOString()])

  await db.run("DELETE FROM temp_emails WHERE expires_at < ?", [new Date().toISOString()])
}

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export async function getRawEmail(email: string, id: string): Promise<{ raw: string } | null> {
  const row = await db.get("SELECT raw FROM emails WHERE to_address = ? AND id = ?", [email, id])
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
  const row = await db.get(
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
  // Delete attachments first
  await db.run("DELETE FROM attachments WHERE email_id = ?", [id])

  // Delete email
  const result = await db.run("DELETE FROM emails WHERE to_address = ? AND id = ?", [email, id])

  return (result.changes || 0) > 0
}

export async function deleteAllEmailsForAccount(email: string): Promise<number> {
  // Get all email IDs for this account
  const emailIds = await db.all("SELECT id FROM emails WHERE to_address = ?", [email])

  // Delete all attachments for these emails
  for (const emailRow of emailIds) {
    await db.run("DELETE FROM attachments WHERE email_id = ?", [emailRow.id])
  }

  // Delete all emails for this account
  const result = await db.run("DELETE FROM emails WHERE to_address = ?", [email])

  // Delete temp email record
  await db.run("DELETE FROM temp_emails WHERE email = ?", [email])

  return result.changes || 0
}

export async function getEmailsForAddressWithAttachments(email: string): Promise<(Email & { attachments?: any[] })[]> {
  // Try exact match first
  let rows = await db.all(
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
    rows = await db.all(
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
  const row = await db.get(
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
  const rows = await db.all("SELECT DISTINCT to_address FROM emails ORDER BY to_address")
  return rows.map((row) => row.to_address)
}

export interface EmailFilters {
  email: string
  subject?: string
  sender?: string
  recipient?: string
  limit?: number
  offset?: number
}

export interface FilteredEmailsResult {
  emails: Email[]
  total: number
  hasMore: boolean
}

export async function getFilteredEmails(filters: EmailFilters): Promise<FilteredEmailsResult> {
  const { email, subject, sender, recipient, limit = 50, offset = 0 } = filters
  
  let whereConditions = ["to_address LIKE ?"]
  let params: any[] = [`%${email}%`]
  
  if (subject) {
    whereConditions.push("subject LIKE ?")
    params.push(`%${subject}%`)
  }
  
  if (sender) {
    whereConditions.push("from_address LIKE ?")
    params.push(`%${sender}%`)
  }
  
  if (recipient) {
    whereConditions.push("to_address LIKE ?")
    params.push(`%${recipient}%`)
  }
  
  const whereClause = whereConditions.join(" AND ")
  
  const countQuery = `SELECT COUNT(*) as total FROM emails WHERE ${whereClause}`
  const countResult = await db.get(countQuery, params)
  const total = countResult.total
  
  const dataQuery = `
    SELECT * FROM emails 
    WHERE ${whereClause} 
    ORDER BY timestamp DESC 
    LIMIT ? OFFSET ?
  `
  
  const rows = await db.all(dataQuery, [...params, limit, offset])
  
  const emails = rows.map((row) => ({
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
  
  return {
    emails,
    total,
    hasMore: offset + limit < total
  }
}
