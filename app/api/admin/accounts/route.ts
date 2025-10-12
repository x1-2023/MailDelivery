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
    const accounts = await getAllEmailAccountsWithStats()
    return NextResponse.json(accounts)
  } catch (error) {
    console.error("Error fetching accounts:", error)
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 })
  }
}
