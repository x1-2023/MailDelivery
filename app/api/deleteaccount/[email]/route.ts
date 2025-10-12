import { type NextRequest, NextResponse } from "next/server"
import { deleteAllEmailsForAccount } from "@/lib/email-service"
import { requireAuth } from "@/lib/auth-middleware"
import { userOwnsEmail } from "@/lib/auth-service"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  // Require authentication
  const auth = await requireAuth(request)
  if (auth.error) {
    return auth.error
  }

  const { user } = auth

  try {
    const { email } = await params

    if (!email) {
      return NextResponse.json({ error: "Email parameter is required" }, { status: 400 })
    }

    // Only admins can delete any account, regular users can only delete their own
    if (user.role !== "admin") {
      if (!userOwnsEmail(user.id, email)) {
        return NextResponse.json(
          { error: "Forbidden", message: "You don't have permission to delete this account" },
          { status: 403 }
        )
      }
    }

    const deletedCount = await deleteAllEmailsForAccount(email)

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} emails and all attachments for account ${email}`,
      deletedCount,
    })
  } catch (error) {
    console.error("Error deleting account:", error)
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}
