import { type NextRequest, NextResponse } from "next/server"
import { getFilteredEmails, saveIncomingEmail } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { emails, targetEmail } = body

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json({ error: "Emails array is required" }, { status: 400 })
    }

    if (!targetEmail) {
      return NextResponse.json({ error: "Target email is required" }, { status: 400 })
    }

    const results = []
    const errors = []

    for (const emailData of emails) {
      try {
        const { from, subject, body, html, originalRecipient } = emailData
        
        if (!from || !subject) {
          errors.push({ email: emailData, error: "Missing required fields (from, subject)" })
          continue
        }

        const forwardedEmail = {
          from: from,
          to: targetEmail,
          subject: `[Forwarded from ${originalRecipient || 'Gmail'}] ${subject}`,
          body: `Original recipient: ${originalRecipient || 'Unknown'}\n\n${body || ''}`,
          html: html || undefined,
          timestamp: new Date().toISOString(),
          read: false,
          starred: false
        }

        await saveIncomingEmail(forwardedEmail)
        results.push({ success: true, originalFrom: from, forwardedTo: targetEmail })
      } catch (error) {
        errors.push({ email: emailData, error: error instanceof Error ? error.message : String(error) })
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      errorCount: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error("Error processing bulk emails:", error)
    return NextResponse.json({ error: "Failed to process bulk emails" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const targetEmail = searchParams.get("targetEmail")
    const originalSender = searchParams.get("originalSender")
    const originalRecipient = searchParams.get("originalRecipient")
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")

    if (!targetEmail) {
      return NextResponse.json({ error: "Target email parameter is required" }, { status: 400 })
    }

    const filters = {
      email: targetEmail,
      sender: originalSender || undefined,
      recipient: originalRecipient || undefined,
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0
    }

    const result = await getFilteredEmails(filters)
    
    const forwardedEmails = result.emails.filter(email => 
      email.subject.includes('[Forwarded from') || 
      email.body.includes('Original recipient:')
    )

    return NextResponse.json({
      emails: forwardedEmails,
      total: forwardedEmails.length,
      hasMore: result.hasMore,
      filters: {
        targetEmail,
        originalSender: originalSender || null,
        originalRecipient: originalRecipient || null
      }
    })
  } catch (error) {
    console.error("Error fetching bulk forwarded emails:", error)
    return NextResponse.json({ error: "Failed to fetch bulk forwarded emails" }, { status: 500 })
  }
}