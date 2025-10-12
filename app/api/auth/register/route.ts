import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-middleware"
import { createUser, getUserByUsername } from "@/lib/auth-service"

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)

  if (auth.error) {
    return auth.error
  }

  try {
    const body = await request.json()
    const { username, password, role = "user" } = body

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    if (role !== "user" && role !== "admin") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Check if username already exists
    const existing = getUserByUsername(username)
    if (existing) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 })
    }

    const user = await createUser(username, password, role)

    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
