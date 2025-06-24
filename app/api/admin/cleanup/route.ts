import { type NextRequest, NextResponse } from "next/server"
import { runManualCleanup } from "@/lib/admin-service"

export async function POST(request: NextRequest) {
  try {
    const result = await runManualCleanup()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error running cleanup:", error)
    return NextResponse.json({ error: "Failed to run cleanup" }, { status: 500 })
  }
}
