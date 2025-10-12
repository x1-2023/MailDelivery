import { type NextRequest, NextResponse } from "next/server"
import { toggleEmailStar } from "@/lib/email-service"
import { allowAnonymous } from "@/lib/auth-middleware"
import { Database } from "@/lib/database"

const db = new Database()

export async function POST(request: NextRequest) {
  // Allow both authenticated and anonymous users
  const { user, isAnonymous } = await allowAnonymous(request)

  try {
    const { id, starred } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Email ID is required" }, { status: 400 })
    }

    // Get email to check ownership
    const email = await db.get("SELECT to_address FROM emails WHERE id = ?", [id])
    
    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 })
    }

    // For authenticated non-admin users: verify ownership
    if (!isAnonymous && user.role !== "admin") {
      const { userOwnsEmail } = await import("@/lib/auth-service")
      if (!userOwnsEmail(user.id, email.to_address)) {
        return NextResponse.json(
          { error: "Forbidden", message: "You don't have permission to star this email" },
          { status: 403 }
        )
      }
    }

    // For anonymous users: check if email is owned by someone
    if (isAnonymous) {
      const { isEmailAssigned } = await import("@/lib/auth-service")
      if (isEmailAssigned(email.to_address)) {
        return NextResponse.json(
          { error: "Forbidden", message: "This email is owned by a registered user" },
          { status: 403 }
        )
      }
    }

    await toggleEmailStar(id, starred)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error toggling star:", error)
    return NextResponse.json({ error: "Failed to toggle star" }, { status: 500 })
  }
}
