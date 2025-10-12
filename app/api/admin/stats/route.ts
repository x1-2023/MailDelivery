import { type NextRequest, NextResponse } from "next/server"
import { getAdminStats } from "@/lib/admin-service"
import { requireAdmin } from "@/lib/auth-middleware"

export async function GET(request: NextRequest) {
  // Require admin authentication
  const auth = await requireAdmin(request)
  if (auth.error) {
    return auth.error
  }

  try {
    const stats = await getAdminStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
