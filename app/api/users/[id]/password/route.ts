import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-middleware"
import { authDb } from "@/lib/auth-database"
import { hashPassword } from "@/lib/password"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request)

  if (auth.error) {
    return auth.error
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Check if user exists
    const user = authDb.prepare("SELECT id FROM users WHERE id = ?").get(id)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Hash new password
    const passwordHash = await hashPassword(password)

    // Update password
    authDb.prepare("UPDATE users SET password = ? WHERE id = ?").run(passwordHash, id)

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    })
  } catch (error) {
    console.error("Admin change password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
