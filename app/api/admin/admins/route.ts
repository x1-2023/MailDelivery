import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-middleware"
import { Database } from "@/lib/database"
import bcrypt from "bcryptjs"

let db: Database | null = null
async function getDb() {
  if (!db) {
    db = new Database()
    await (await getDb()).init()
  }
  return db
}

// GET - List all admins
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult.error) {
    return authResult.error
  }

  try {
    const admins = await (await getDb()).all(`
      SELECT 
        id, 
        username, 
        email, 
        role, 
        created_at, 
        last_login,
        is_active
      FROM users 
      WHERE role = 'admin'
      ORDER BY created_at DESC
    `)

    return NextResponse.json({ 
      success: true, 
      admins 
    })
  } catch (error: any) {
    console.error("Failed to fetch admins:", error)
    return NextResponse.json(
      { error: "Failed to fetch admins", details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create new admin
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult.error) {
    return authResult.error
  }

  try {
    const body = await request.json()
    const { username, password, email, role = "admin" } = body

    // Validation
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      )
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existing = await (await getDb()).get(
      "SELECT id FROM users WHERE username = ?",
      [username]
    )

    if (existing) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insert new admin
    const result = await (await getDb()).run(
      `INSERT INTO users (username, password, email, role, is_active, created_at) 
       VALUES (?, ?, ?, ?, 1, datetime('now'))`,
      [username, hashedPassword, email || null, role]
    )

    return NextResponse.json({
      success: true,
      message: "Admin created successfully",
      adminId: result.lastID,
    })
  } catch (error: any) {
    console.error("Failed to create admin:", error)
    return NextResponse.json(
      { error: "Failed to create admin", details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update admin
export async function PUT(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult.error) {
    return authResult.error
  }

  try {
    const body = await request.json()
    const { id, username, password, email, role } = body

    if (!id) {
      return NextResponse.json(
        { error: "Admin ID is required" },
        { status: 400 }
      )
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []

    if (username) {
      // Check if new username is already taken by another admin
      const existing = await (await getDb()).get(
        "SELECT id FROM users WHERE username = ? AND id != ?",
        [username, id]
      )
      if (existing) {
        return NextResponse.json(
          { error: "Username already exists" },
          { status: 409 }
        )
      }
      updates.push("username = ?")
      values.push(username)
    }

    if (email !== undefined) {
      updates.push("email = ?")
      values.push(email || null)
    }

    if (role) {
      updates.push("role = ?")
      values.push(role)
    }

    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        )
      }
      const hashedPassword = await bcrypt.hash(password, 10)
      updates.push("password = ?")
      values.push(hashedPassword)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      )
    }

    updates.push("updated_at = datetime('now')")
    values.push(id)

    await (await getDb()).run(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      values
    )

    return NextResponse.json({
      success: true,
      message: "Admin updated successfully",
    })
  } catch (error: any) {
    console.error("Failed to update admin:", error)
    return NextResponse.json(
      { error: "Failed to update admin", details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete admin
export async function DELETE(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult.error) {
    return authResult.error
  }

  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: "Admin ID is required" },
        { status: 400 }
      )
    }

    // Check if this is the last admin
    const adminCount = await (await getDb()).get(
      "SELECT COUNT(*) as count FROM users WHERE role = 'admin'"
    )

    if (adminCount.count <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last admin account" },
        { status: 400 }
      )
    }

    // Check if trying to delete self
    const currentAdmin = authResult.user
    if (currentAdmin.id === id) {
      return NextResponse.json(
        { error: "Cannot delete your own admin account" },
        { status: 400 }
      )
    }

    await (await getDb()).run("DELETE FROM users WHERE id = ? AND role = 'admin'", [id])

    return NextResponse.json({
      success: true,
      message: "Admin deleted successfully",
    })
  } catch (error: any) {
    console.error("Failed to delete admin:", error)
    return NextResponse.json(
      { error: "Failed to delete admin", details: error.message },
      { status: 500 }
    )
  }
}

// PATCH - Toggle active status
export async function PATCH(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult.error) {
    return authResult.error
  }

  try {
    const body = await request.json()
    const { id, is_active } = body

    if (!id || is_active === undefined) {
      return NextResponse.json(
        { error: "Admin ID and is_active status are required" },
        { status: 400 }
      )
    }

    // Check if trying to deactivate self
    const currentAdmin = authResult.user
    if (currentAdmin.id === id && !is_active) {
      return NextResponse.json(
        { error: "Cannot deactivate your own admin account" },
        { status: 400 }
      )
    }

    // Check if this is the last active admin
    if (!is_active) {
      const activeCount = await (await getDb()).get(
        "SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND is_active = 1"
      )

      if (activeCount.count <= 1) {
        return NextResponse.json(
          { error: "Cannot deactivate the last active admin" },
          { status: 400 }
        )
      }
    }

    await (await getDb()).run(
      "UPDATE users SET is_active = ?, updated_at = datetime('now') WHERE id = ?",
      [is_active ? 1 : 0, id]
    )

    return NextResponse.json({
      success: true,
      message: is_active ? "Admin activated" : "Admin deactivated",
    })
  } catch (error: any) {
    console.error("Failed to toggle admin status:", error)
    return NextResponse.json(
      { error: "Failed to toggle admin status", details: error.message },
      { status: 500 }
    )
  }
}

