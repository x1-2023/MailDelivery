import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-middleware"

/**
 * Check if user is authenticated
 * GET /api/auth/check
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)

  if (auth.error) {
    return NextResponse.json({ authenticated: false, error: "Not authenticated" }, { status: 401 })
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: auth.user.id,
      username: auth.user.username,
      role: auth.user.role,
    },
  })
}
