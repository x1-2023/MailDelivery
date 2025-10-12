import bcrypt from "bcryptjs"
import crypto from "crypto"

const SALT_ROUNDS = 10

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Generate random token
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

/**
 * Generate random user ID
 */
export function generateUserId(): string {
  return crypto.randomBytes(16).toString("hex")
}

/**
 * Parse Basic Auth header
 */
export function parseBasicAuth(authHeader: string): { username: string; password: string } | null {
  if (!authHeader?.startsWith("Basic ")) {
    return null
  }

  try {
    const base64Credentials = authHeader.slice(6)
    const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8")
    const [username, password] = credentials.split(":")

    if (!username || !password) {
      return null
    }

    return { username, password }
  } catch {
    return null
  }
}

/**
 * Parse Bearer token from header
 */
export function parseBearerToken(authHeader: string): string | null {
  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }

  return authHeader.slice(7)
}
