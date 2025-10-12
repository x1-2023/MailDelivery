import { type NextRequest, NextResponse } from "next/server"
import { deleteSpecificEmail } from "@/lib/email-service"
import { requireAuth } from "@/lib/auth-middleware"
import { userOwnsEmail } from "@/lib/auth-service"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ email: string; id: string }> }) {
  // Require authentication
  const auth = await requireAuth(request)
  if (auth.error) {
    return auth.error
  }

  const { user } = auth

  try {
    const { email, id } = await params

    if (!email || !id) {
      return NextResponse.json({ error: "Email and ID parameters are required" }, { status: 400 })
    }

    // Only admins can delete any email, regular users can only delete their own
    if (user.role !== "admin") {
      if (!userOwnsEmail(user.id, email)) {
        return NextResponse.json(
          { error: "Forbidden", message: "You don't have permission to delete emails from this account" },
          { status: 403 }
        )
      }
    }

    const deleted = await deleteSpecificEmail(email, id)

    if (!deleted) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Email and attachments deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting email:", error)
    return NextResponse.json({ error: "Failed to delete email" }, { status: 500 })
  }
}
