import { type NextRequest, NextResponse } from "next/server"
import { getAllEmailAccounts } from "@/lib/email-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const showAccountList = searchParams.get("SHOW_ACCOUNT_LIST") === "true"

    if (!showAccountList) {
      return NextResponse.json({ error: "Account listing is disabled" }, { status: 403 })
    }

    const accounts = await getAllEmailAccounts()

    return NextResponse.json(accounts)
  } catch (error) {
    console.error("Error fetching account list:", error)
    return NextResponse.json({ error: "Failed to fetch account list" }, { status: 500 })
  }
}
