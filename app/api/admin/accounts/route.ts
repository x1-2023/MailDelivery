import { type NextRequest, NextResponse } from "next/server"
import { getAllEmailAccountsWithStats } from "@/lib/admin-service"

export async function GET(request: NextRequest) {
  try {
    const accounts = await getAllEmailAccountsWithStats()
    return NextResponse.json(accounts)
  } catch (error) {
    console.error("Error fetching accounts:", error)
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 })
  }
}
