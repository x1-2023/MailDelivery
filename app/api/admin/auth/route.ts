import { type NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/auth-service"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      )
    }

    const result = await authenticateUser(username, password)

    if (!result) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Check if user is admin
    if (result.user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden", message: "Admin access required" },
        { status: 403 }
      )
    }

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        username: result.user.username,
        role: result.user.role
      }
    })

    response.cookies.set("session_token", result.session.token, {
      httpOnly: true,
      secure: false, // Disable for HTTP (enable when HTTPS is available)
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Admin auth error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
