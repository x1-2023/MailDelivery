import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-middleware"
import { transferEmailBetweenUsers } from "@/lib/auth-service"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)

  if (auth.error) {
    return auth.error
  }

  try {
    const { id: fromUserId } = await params
    const body = await request.json()
    const { email, toUserId } = body

    if (!email || !toUserId) {
      return NextResponse.json(
        { error: "Email and target user ID are required" },
        { status: 400 }
      )
    }

    // Transfer email ownership
    const success = transferEmailBetweenUsers(fromUserId, toUserId, email)

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Email "${email}" transferred successfully`,
      })
    } else {
      return NextResponse.json(
        { error: "Failed to transfer email. It may not exist or already belongs to target user." },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Transfer email error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
