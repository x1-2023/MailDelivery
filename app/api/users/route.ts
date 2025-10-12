import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-middleware"
import { listUsers } from "@/lib/auth-service"

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)

  if (auth.error) {
    return auth.error
  }

  try {
    const users = listUsers()

    return NextResponse.json({
      success: true,
      users,
    })
  } catch (error) {
    console.error("List users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
