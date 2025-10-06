import { type NextRequest, NextResponse } from "next/server"
import { getEmailsForAddress } from "@/lib/email-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")

    if (!email) {
      return NextResponse.json({ error: "Email parameter is required" }, { status: 400 })
    }

    const emails = await getEmailsForAddress(email)
    
    const limitNum = limit ? parseInt(limit) : emails.length
    const offsetNum = offset ? parseInt(offset) : 0
    
    const paginatedEmails = emails.slice(offsetNum, offsetNum + limitNum)
    
    return NextResponse.json({
      emails: paginatedEmails,
      total: emails.length,
      hasMore: offsetNum + limitNum < emails.length,
      pagination: {
        limit: limitNum,
        offset: offsetNum
      }
    })
  } catch (error) {
    console.error("Error fetching emails:", error)
    return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 })
  }
}
