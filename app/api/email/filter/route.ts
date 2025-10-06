import { type NextRequest, NextResponse } from "next/server"
import { getFilteredEmails } from "@/lib/email-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")
    const subject = searchParams.get("subject")
    const sender = searchParams.get("sender")
    const recipient = searchParams.get("recipient")
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")

    if (!email) {
      return NextResponse.json({ error: "Email parameter is required" }, { status: 400 })
    }

    const filters = {
      email,
      subject: subject || undefined,
      sender: sender || undefined,
      recipient: recipient || undefined,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0
    }

    const result = await getFilteredEmails(filters)

    return NextResponse.json({
      emails: result.emails,
      total: result.total,
      hasMore: result.hasMore,
      filters: {
        subject: subject || null,
        sender: sender || null,
        recipient: recipient || null
      }
    })
  } catch (error) {
    console.error("Error filtering emails:", error)
    return NextResponse.json({ error: "Failed to filter emails" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, filters } = body

    if (!email) {
      return NextResponse.json({ error: "Email parameter is required" }, { status: 400 })
    }

    const filterParams = {
      email,
      subject: filters?.subject || undefined,
      sender: filters?.sender || undefined,
      recipient: filters?.recipient || undefined,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0
    }

    const result = await getFilteredEmails(filterParams)

    return NextResponse.json({
      emails: result.emails,
      total: result.total,
      hasMore: result.hasMore,
      filters: filters || {}
    })
  } catch (error) {
    console.error("Error filtering emails:", error)
    return NextResponse.json({ error: "Failed to filter emails" }, { status: 500 })
  }
}