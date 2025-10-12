import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-middleware"
import { authDb } from "@/lib/auth-database"
import { hashPassword, verifyPassword } from "@/lib/password"

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)

  if (auth.error) {
    return auth.error
  }

  try {
    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 },
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Get current password hash
    const user = authDb.prepare("SELECT password FROM users WHERE id = ?").get(auth.user.id) as any

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.password)
    if (!isValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 })
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update password
    authDb.prepare("UPDATE users SET password = ? WHERE id = ?").run(newPasswordHash, auth.user.id)

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
