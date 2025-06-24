import { type NextRequest, NextResponse } from "next/server"
import { getAdminStats } from "@/lib/admin-service"

export async function GET(request: NextRequest) {
  try {
    const stats = await getAdminStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
