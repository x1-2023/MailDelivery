import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-middleware"

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)

  if (auth.error) {
    return auth.error
  }

  return NextResponse.json({
    authenticated: true,
    user: auth.user,
  })
}
