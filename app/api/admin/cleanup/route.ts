import { type NextRequest, NextResponse } from "next/server"
import { runManualCleanup } from "@/lib/admin-service"
import { requireAdmin } from "@/lib/auth-middleware"

export async function POST(request: NextRequest) {
  // Require admin authentication
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error

  try {
    const result = await runManualCleanup()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error running cleanup:", error)
    return NextResponse.json({ error: "Failed to run cleanup" }, { status: 500 })
  }
}
