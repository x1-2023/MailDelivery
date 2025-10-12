import { NextRequest, NextResponse } from "next/server"
import { authDb, initializeAuthTables } from "@/lib/auth-database"
import bcrypt from "bcryptjs"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    // Initialize tables first
    initializeAuthTables()

    // Check if any admin exists
    const existingAdmin = authDb.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get() as { count: number }

    if (existingAdmin && existingAdmin.count > 0) {
      return NextResponse.json(
        { error: "Admin user already exists" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    // Check if username already taken
    const existing = authDb.prepare("SELECT id FROM users WHERE username = ?").get(username)

    if (existing) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      )
    }

    // Create admin user
    const userId = crypto.randomUUID()
    const hashedPassword = bcrypt.hashSync(password, 10)
    const now = new Date().toISOString()

    authDb.prepare(`
      INSERT INTO users (id, username, password, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, 'admin', 1, ?, ?)
    `).run(userId, username, hashedPassword, now, now)

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      username
    })
  } catch (error: any) {
    console.error("Failed to create initial admin:", error)
    return NextResponse.json(
      { error: "Failed to create admin user", details: error.message },
      { status: 500 }
    )
  }
}
