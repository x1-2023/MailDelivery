import { type NextRequest, NextResponse } from "next/server"
import { toggleEmailStar } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const { id, starred } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Email ID is required" }, { status: 400 })
    }

    await toggleEmailStar(id, starred)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error toggling star:", error)
    return NextResponse.json({ error: "Failed to toggle star" }, { status: 500 })
  }
}
