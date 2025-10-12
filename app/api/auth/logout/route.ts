import { NextRequest, NextResponse } from "next/server"
import { logout } from "@/lib/auth-service"

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value
    const authHeader = request.headers.get("authorization")
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null

    const sessionToken = token || bearerToken

    if (sessionToken) {
      logout(sessionToken)
    }

    const response = NextResponse.json({ success: true })

    // Clear cookie
    response.cookies.delete("session_token")

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
