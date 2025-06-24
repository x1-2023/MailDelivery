import { type NextRequest, NextResponse } from "next/server"
import { deleteAllEmailsForAccount } from "@/lib/email-service"

export async function DELETE(request: NextRequest, { params }: { params: { email: string } }) {
  try {
    const { email } = params

    if (!email) {
      return NextResponse.json({ error: "Email parameter is required" }, { status: 400 })
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
