import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/auth-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    const result = await authenticateUser(username, password)

    if (!result) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const response = NextResponse.json({
      success: true,
      user: result.user,
      token: result.session.token,
    })

    // Set httpOnly cookie for web clients
    response.cookies.set("session_token", result.session.token, {
      httpOnly: true,
      secure: false, // Disable for HTTP (enable when HTTPS is available)
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
