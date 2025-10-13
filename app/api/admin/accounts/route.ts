import { type NextRequest, NextResponse } from "next/server"
import { getAllEmailAccountsWithStats } from "@/lib/admin-service"
import { requireAdmin } from "@/lib/auth-middleware"

export async function GET(request: NextRequest) {
  // Require admin authentication
  const auth = await requireAdmin(request)
  if (auth.error) {
    return auth.error
  }

  try {
    // Get pagination params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    const accounts = await getAllEmailAccountsWithStats(limit, offset)
    return NextResponse.json(accounts)
  } catch (error) {
    console.error("Error fetching accounts:", error)
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 })
  }
}
