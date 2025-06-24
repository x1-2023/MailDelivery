import { type NextRequest, NextResponse } from "next/server"
import { deleteSpecificEmail } from "@/lib/email-service"

export async function DELETE(request: NextRequest, { params }: { params: { email: string; id: string } }) {
  try {
    const { email, id } = params

    if (!email || !id) {
      return NextResponse.json({ error: "Email and ID parameters are required" }, { status: 400 })
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
