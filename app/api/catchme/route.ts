import { type NextRequest, NextResponse } from "next/server"
import { getFilteredEmails } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { targetEmail, sender, subject } = body

    // Validate required field
    if (!targetEmail) {
      return NextResponse.json(
        { error: "Target email is required" },
        { status: 400 }
      )
    }

    // Get domain from environment config
    const domains = process.env.DOMAINS?.split(',') || []
    const catchmeEmails = domains.map(domain => `catchme@${domain.trim()}`)
    
    // Check if target email is valid catchme email
    if (!catchmeEmails.includes(targetEmail)) {
      return NextResponse.json(
        { error: `Only catchme emails are supported: ${catchmeEmails.join(', ')}` },
        { status: 400 }
      )
    }

    // Build filter criteria
    const filters: any = {
      email: targetEmail
    }

    if (sender) {
      filters.sender = sender
    }

    if (subject) {
      filters.subject = subject
    }

    // Get filtered emails
    const result = await getFilteredEmails(filters)

    // Emails are already sorted by timestamp DESC in getFilteredEmails
    return NextResponse.json({
      success: true,
      targetEmail,
      count: result.emails.length,
      total: result.total,
      hasMore: result.hasMore,
      emails: result.emails
    })

  } catch (error) {
    console.error("Error checking target email:", error)
    return NextResponse.json(
      { error: "Failed to check target email" },
      { status: 500 }
    )
  }
}