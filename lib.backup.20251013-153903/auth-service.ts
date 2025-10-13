import { authDb } from "./auth-database"
import { hashPassword, verifyPassword, generateToken, generateUserId } from "./password"

export interface User {
  id: string
  username: string
  role: "admin" | "user"
  created_at: string
  last_login?: string
}

export interface Session {
  id: string
  user_id: string
  token: string
  expires_at: string | null
  created_at: string
}

/**
 * Create a new user
 */
export async function createUser(
  username: string,
  password: string,
  role: "admin" | "user" = "user",
): Promise<User> {
  const id = generateUserId()
  const hashedPassword = await hashPassword(password)

  const stmt = authDb.prepare(`
    INSERT INTO users (id, username, password, role)
    VALUES (?, ?, ?, ?)
  `)

  stmt.run(id, username, hashedPassword, role)

  return {
    id,
    username,
    role,
    created_at: new Date().toISOString(),
  }
}

/**
 * Authenticate user and create session
 */
export async function authenticateUser(
  username: string,
  password: string,
): Promise<{ user: User; session: Session } | null> {
  const user = authDb
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username) as any

  if (!user) {
    return null
  }

  const isValid = await verifyPassword(password, user.password)
  if (!isValid) {
    return null
  }

  // Update last login
  authDb.prepare("UPDATE users SET last_login = ? WHERE id = ?").run(new Date().toISOString(), user.id)

  // Create session (no expiry for permanent login)
  const sessionId = generateUserId()
  const token = generateToken()

  authDb
    .prepare(`
    INSERT INTO sessions (id, user_id, token, expires_at)
    VALUES (?, ?, ?, NULL)
  `)
    .run(sessionId, user.id, token)

  return {
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      created_at: user.created_at,
      last_login: user.last_login,
    },
    session: {
      id: sessionId,
      user_id: user.id,
      token,
      expires_at: null,
      created_at: new Date().toISOString(),
    },
  }
}

/**
 * Validate session token
 */
export function validateSession(token: string): User | null {
  const session = authDb
    .prepare(
      `
    SELECT s.*, u.username, u.role, u.created_at, u.last_login
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ?
  `,
    )
    .get(token) as any

  if (!session) {
    return null
  }

  // Check if expired (if expires_at is set)
  if (session.expires_at && new Date(session.expires_at) < new Date()) {
    // Delete expired session
    authDb.prepare("DELETE FROM sessions WHERE id = ?").run(session.id)
    return null
  }

  return {
    id: session.user_id,
    username: session.username,
    role: session.role,
    created_at: session.created_at,
    last_login: session.last_login,
  }
}

/**
 * Logout user (delete session)
 */
export function logout(token: string): boolean {
  const result = authDb.prepare("DELETE FROM sessions WHERE token = ?").run(token)
  return result.changes > 0
}

/**
 * Get user by ID
 */
export function getUserById(userId: string): User | null {
  const user = authDb.prepare("SELECT id, username, role, created_at, last_login FROM users WHERE id = ?").get(userId) as any

  return user || null
}

/**
 * Get user by username
 */
export function getUserByUsername(username: string): User | null {
  const user = authDb
    .prepare("SELECT id, username, role, created_at, last_login FROM users WHERE username = ?")
    .get(username) as any

  return user || null
}

/**
 * List all users (admin only)
 */
export function listUsers(): User[] {
  return authDb.prepare("SELECT id, username, role, created_at, last_login FROM users ORDER BY created_at DESC").all() as User[]
}

/**
 * Delete user
 */
export function deleteUser(userId: string): boolean {
  const result = authDb.prepare("DELETE FROM users WHERE id = ?").run(userId)
  return result.changes > 0
}

/**
 * Assign email address to user
 * If email exists in temp_emails as orphan, update its user_id
 * Otherwise, insert into user_emails table
 */
export function assignEmailToUser(userId: string, emailAddress: string): boolean {
  try {
    // First, check if email exists in temp_emails as orphan
    const BetterSqlite3 = require("better-sqlite3")
    const path = require("path")
    
    const dbPath = process.env.NODE_ENV === "production"
      ? "/var/www/opentrashmail/data/emails.db"
      : path.join(process.cwd(), "data", "emails.db")
    
    const emailsDb = new BetterSqlite3(dbPath)
    
    // Check if this is an orphan email
    const orphan = emailsDb.prepare("SELECT email FROM temp_emails WHERE email = ? AND (user_id IS NULL OR user_id = '')").get(emailAddress) as any
    
    if (orphan) {
      // It's an orphan email - update user_id in temp_emails
      emailsDb.prepare("UPDATE temp_emails SET user_id = ? WHERE email = ?").run(userId, emailAddress)
      emailsDb.close()
      return true
    }
    
    emailsDb.close()
    
    // Not an orphan - insert into user_emails table (manual assignment by admin)
    authDb.prepare("INSERT INTO user_emails (user_id, email_address) VALUES (?, ?)").run(userId, emailAddress)
    return true
  } catch (error) {
    console.error("Error assigning email:", error)
    return false
  }
}

/**
 * Remove email address from user
 */
export function removeEmailFromUser(userId: string, emailAddress: string): boolean {
  const result = authDb
    .prepare("DELETE FROM user_emails WHERE user_id = ? AND email_address = ?")
    .run(userId, emailAddress)
  return result.changes > 0
}

/**
 * Get user's email addresses (both assigned and self-created)
 */
export function getUserEmails(userId: string): any[] {
  // Get emails from user_emails table (assigned by admin)
  const assignedEmails = authDb.prepare("SELECT email_address FROM user_emails WHERE user_id = ?").all(userId) as any[]

  // Get emails from temp_emails table (created by user) using better-sqlite3
  let createdEmails: any[] = []
  try {
    const BetterSqlite3 = require("better-sqlite3")
    const path = require("path")
    
    const dbPath = process.env.NODE_ENV === "production"
      ? "/var/www/opentrashmail/data/emails.db"
      : path.join(process.cwd(), "data", "emails.db")
    
    const emailsDb = new BetterSqlite3(dbPath)
    
    // Create temp_emails table if not exists (with user_id column)
    emailsDb.exec(`
      CREATE TABLE IF NOT EXISTS temp_emails (
        email TEXT PRIMARY KEY,
        domain TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        user_id TEXT,
        is_anonymous INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    const query = emailsDb.prepare("SELECT email, domain, expires_at FROM temp_emails WHERE user_id = ?")
    createdEmails = query.all(userId) as any[]
    
    emailsDb.close()
  } catch (error) {
    console.error("Error querying temp_emails:", error)
  }

  // Combine both lists and remove duplicates (temp_emails takes priority)
  const emailMap = new Map<string, any>()
  
  // First add assigned emails
  for (const row of assignedEmails) {
    emailMap.set(row.email_address, {
      emailAddress: row.email_address,
      source: "assigned",
    })
  }
  
  // Then add/override with created emails (they have more info)
  for (const row of createdEmails) {
    emailMap.set(row.email, {
      emailAddress: row.email,
      domain: row.domain,
      expiresAt: row.expires_at,
      source: "created",
    })
  }

  return Array.from(emailMap.values())
}

/**
 * Get orphan emails (emails without user_id in temp_emails table)
 */
export function getOrphanEmails(): string[] {
  try {
    const BetterSqlite3 = require("better-sqlite3")
    const path = require("path")
    
    const dbPath = process.env.NODE_ENV === "production"
      ? "/var/www/opentrashmail/data/emails.db"
      : path.join(process.cwd(), "data", "emails.db")
    
    const emailsDb = new BetterSqlite3(dbPath)
    
    // Get emails where user_id is NULL or empty
    const orphanEmails = emailsDb.prepare("SELECT email FROM temp_emails WHERE user_id IS NULL OR user_id = ''").all() as any[]
    
    emailsDb.close()
    
    return orphanEmails.map((row) => row.email)
  } catch (error) {
    console.error("Error getting orphan emails:", error)
    return []
  }
}

/**
 * Assign orphan email to user (update temp_emails table)
 */
export function assignOrphanEmailToUser(emailAddress: string, userId: string): boolean {
  try {
    const BetterSqlite3 = require("better-sqlite3")
    const path = require("path")
    
    const dbPath = process.env.NODE_ENV === "production"
      ? "/var/www/opentrashmail/data/emails.db"
      : path.join(process.cwd(), "data", "emails.db")
    
    const emailsDb = new BetterSqlite3(dbPath)
    
    // Update user_id for the orphan email
    const result = emailsDb.prepare("UPDATE temp_emails SET user_id = ? WHERE email = ?").run(userId, emailAddress)
    
    emailsDb.close()
    
    return result.changes > 0
  } catch (error) {
    console.error("Error assigning orphan email:", error)
    return false
  }
}

/**
 * Get user ID by email address
 */
export function getUserIdByEmail(emailAddress: string): string | null {
  const row = authDb.prepare("SELECT user_id FROM user_emails WHERE email_address = ?").get(emailAddress) as any

  return row?.user_id || null
}

/**
 * Check if user owns email address
 */
export function userOwnsEmail(userId: string, emailAddress: string): boolean {
  const row = authDb
    .prepare("SELECT 1 FROM user_emails WHERE user_id = ? AND email_address = ?")
    .get(userId, emailAddress)

  return !!row
}

/**
 * Check if email is assigned to anyone
 */
export function isEmailAssigned(emailAddress: string): boolean {
  const row = authDb
    .prepare("SELECT 1 FROM user_emails WHERE email_address = ?")
    .get(emailAddress)

  return !!row
}

/**
 * Auto-assign email to user if not already assigned
 * Returns true if assigned (either already was or just assigned)
 */
export function autoAssignEmailToUser(userId: string, emailAddress: string): boolean {
  try {
    // Check if already assigned to someone
    if (isEmailAssigned(emailAddress)) {
      // Check if it's assigned to this user
      return userOwnsEmail(userId, emailAddress)
    }

    // Not assigned to anyone, assign to this user
    authDb.prepare("INSERT INTO user_emails (user_id, email_address) VALUES (?, ?)").run(userId, emailAddress)
    return true
  } catch {
    return false
  }
}

/**
 * Transfer email from one user to another
 */
export function transferEmailBetweenUsers(
  fromUserId: string,
  toUserId: string,
  emailAddress: string
): boolean {
  try {
    // Check if source user owns the email
    if (!userOwnsEmail(fromUserId, emailAddress)) {
      return false
    }

    // Remove from source user
    authDb.prepare("DELETE FROM user_emails WHERE user_id = ? AND email_address = ?").run(fromUserId, emailAddress)

    // Check if target user already has it
    if (!userOwnsEmail(toUserId, emailAddress)) {
      // Assign to target user
      authDb.prepare("INSERT INTO user_emails (user_id, email_address) VALUES (?, ?)").run(toUserId, emailAddress)
    }

    return true
  } catch (error) {
    console.error("Transfer email error:", error)
    return false
  }
}
