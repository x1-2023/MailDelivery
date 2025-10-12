import { Database } from "./database"

const db = new Database()

export interface SpamFilter {
  id?: number
  name: string
  filter_type: "subject" | "sender" | "both"
  subject_pattern?: string
  sender_pattern?: string
  action: "block" | "auto_delete"
  auto_delete_minutes?: number
  enabled: number
  created_at?: string
  updated_at?: string
}

export interface EmailCheckResult {
  isSpam: boolean
  matchedFilter?: SpamFilter
  action: "allow" | "block" | "auto_delete"
  autoDeleteAt?: string
}

/**
 * Get all spam filter rules
 */
export async function getAllSpamFilters(): Promise<SpamFilter[]> {
  return await db.all("SELECT * FROM spam_filters ORDER BY created_at DESC")
}

/**
 * Get enabled spam filter rules only
 */
export async function getEnabledSpamFilters(): Promise<SpamFilter[]> {
  return await db.all("SELECT * FROM spam_filters WHERE enabled = 1 ORDER BY created_at DESC")
}

/**
 * Create new spam filter rule
 */
export async function createSpamFilter(filter: SpamFilter): Promise<number> {
  const result = await db.run(
    `INSERT INTO spam_filters (
      name, filter_type, subject_pattern, sender_pattern, 
      action, auto_delete_minutes, enabled
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      filter.name,
      filter.filter_type,
      filter.subject_pattern || null,
      filter.sender_pattern || null,
      filter.action,
      filter.auto_delete_minutes || null,
      filter.enabled ?? 1,
    ],
  )
  return result.lastID!
}

/**
 * Update spam filter rule
 */
export async function updateSpamFilter(id: number, filter: Partial<SpamFilter>): Promise<void> {
  const updates: string[] = []
  const values: any[] = []

  if (filter.name !== undefined) {
    updates.push("name = ?")
    values.push(filter.name)
  }
  if (filter.filter_type !== undefined) {
    updates.push("filter_type = ?")
    values.push(filter.filter_type)
  }
  if (filter.subject_pattern !== undefined) {
    updates.push("subject_pattern = ?")
    values.push(filter.subject_pattern || null)
  }
  if (filter.sender_pattern !== undefined) {
    updates.push("sender_pattern = ?")
    values.push(filter.sender_pattern || null)
  }
  if (filter.action !== undefined) {
    updates.push("action = ?")
    values.push(filter.action)
  }
  if (filter.auto_delete_minutes !== undefined) {
    updates.push("auto_delete_minutes = ?")
    values.push(filter.auto_delete_minutes || null)
  }
  if (filter.enabled !== undefined) {
    updates.push("enabled = ?")
    values.push(filter.enabled)
  }

  updates.push("updated_at = CURRENT_TIMESTAMP")
  values.push(id)

  await db.run(`UPDATE spam_filters SET ${updates.join(", ")} WHERE id = ?`, values)
}

/**
 * Delete spam filter rule
 */
export async function deleteSpamFilter(id: number): Promise<void> {
  await db.run("DELETE FROM spam_filters WHERE id = ?", [id])
}

/**
 * Toggle spam filter enabled status
 */
export async function toggleSpamFilter(id: number, enabled: boolean): Promise<void> {
  await db.run("UPDATE spam_filters SET enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [
    enabled ? 1 : 0,
    id,
  ])
}

/**
 * Check if email matches any spam filter
 */
export async function checkEmailAgainstFilters(
  fromAddress: string,
  subject: string,
): Promise<EmailCheckResult> {
  const filters = await getEnabledSpamFilters()

  for (const filter of filters) {
    let matches = false

    if (filter.filter_type === "subject" && filter.subject_pattern) {
      // Case-insensitive subject match
      const pattern = filter.subject_pattern.toLowerCase()
      matches = subject.toLowerCase().includes(pattern)
    } else if (filter.filter_type === "sender" && filter.sender_pattern) {
      // Sender pattern can be email or domain
      const pattern = filter.sender_pattern.toLowerCase()
      const from = fromAddress.toLowerCase()
      // Match full email or domain (after @)
      matches = from.includes(pattern) || from.split("@")[1]?.includes(pattern) || false
    } else if (filter.filter_type === "both" && filter.subject_pattern && filter.sender_pattern) {
      // Both conditions must match
      const subjectPattern = filter.subject_pattern.toLowerCase()
      const senderPattern = filter.sender_pattern.toLowerCase()
      const from = fromAddress.toLowerCase()

      const subjectMatches = subject.toLowerCase().includes(subjectPattern)
      const senderMatches = from.includes(senderPattern) || from.split("@")[1]?.includes(senderPattern) || false

      matches = subjectMatches && senderMatches
    }

    if (matches) {
      if (filter.action === "block") {
        return {
          isSpam: true,
          matchedFilter: filter,
          action: "block",
        }
      } else if (filter.action === "auto_delete" && filter.auto_delete_minutes) {
        const deleteAt = new Date()
        deleteAt.setMinutes(deleteAt.getMinutes() + filter.auto_delete_minutes)

        return {
          isSpam: true,
          matchedFilter: filter,
          action: "auto_delete",
          autoDeleteAt: deleteAt.toISOString(),
        }
      }
    }
  }

  return {
    isSpam: false,
    action: "allow",
  }
}

/**
 * Get emails that should be auto-deleted
 */
export async function getEmailsForAutoDeletion(): Promise<any[]> {
  const now = new Date().toISOString()
  return await db.all(
    `SELECT id, to_address, subject, auto_delete_at 
     FROM emails 
     WHERE spam_filtered = 1 
     AND auto_delete_at IS NOT NULL 
     AND auto_delete_at <= ?`,
    [now],
  )
}

/**
 * Delete emails that passed auto-delete time
 */
export async function processAutoDeletion(): Promise<number> {
  const emails = await getEmailsForAutoDeletion()

  for (const email of emails) {
    await db.run("DELETE FROM emails WHERE id = ?", [email.id])
  }

  return emails.length
}

/**
 * Get spam statistics
 */
export async function getSpamStats(): Promise<{
  total_blocked: number
  total_auto_deleted: number
  pending_deletion: number
}> {
  const blocked = await db.get("SELECT COUNT(*) as count FROM emails WHERE spam_filtered = 1 AND auto_delete_at IS NULL")
  const autoDeleted = await db.get("SELECT COUNT(*) as count FROM emails WHERE spam_filtered = 1 AND auto_delete_at IS NOT NULL")
  const pending = (await getEmailsForAutoDeletion()).length

  return {
    total_blocked: blocked?.count || 0,
    total_auto_deleted: autoDeleted?.count || 0,
    pending_deletion: pending,
  }
}
