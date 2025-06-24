import { type NextRequest, NextResponse } from "next/server"
import { markEmailAsRead } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Email ID is required" }, { status: 400 })
    }

    await markEmailAsRead(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error marking email as read:", error)
    return NextResponse.json({ error: "Failed to mark email as read" }, { status: 500 })
  }
}
