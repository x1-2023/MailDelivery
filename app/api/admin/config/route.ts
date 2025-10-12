import { type NextRequest, NextResponse } from "next/server"
import { getSystemConfig, updateSystemConfig } from "@/lib/admin-service"
import { requireAdmin } from "@/lib/auth-middleware"

export async function GET(request: NextRequest) {
  // Require admin authentication
  const auth = await requireAdmin(request)
  if (auth.error) {
    return auth.error
  }

  try {
    const config = await getSystemConfig()
    return NextResponse.json(config)
  } catch (error) {
    console.error("Error fetching config:", error)
    return NextResponse.json({ error: "Failed to fetch config" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  // Require admin authentication
  const auth = await requireAdmin(request)
  if (auth.error) {
    return auth.error
  }

  try {
    const updates = await request.json()
    const config = await updateSystemConfig(updates)
    return NextResponse.json(config)
  } catch (error) {
    console.error("Error updating config:", error)
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 })
  }
}
