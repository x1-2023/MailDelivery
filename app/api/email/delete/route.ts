import { type NextRequest, NextResponse } from "next/server"
import { deleteEmail } from "@/lib/email-service"

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Email ID is required" }, { status: 400 })
    }

    await deleteEmail(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting email:", error)
    return NextResponse.json({ error: "Failed to delete email" }, { status: 500 })
  }
}
