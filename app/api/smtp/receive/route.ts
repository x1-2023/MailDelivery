import { type NextRequest, NextResponse } from "next/server"
import { saveIncomingEmail } from "@/lib/email-service"
import { parseEmail } from "@/lib/email-parser"

export async function POST(request: NextRequest) {
  try {
    const emailData = await request.json()

    // Parse the raw email data
    const parsedEmail = parseEmail(emailData.raw)

    // Save to database
    await saveIncomingEmail({
      from: parsedEmail.from,
      to: parsedEmail.to,
      subject: parsedEmail.subject,
      body: parsedEmail.text,
      html: parsedEmail.html,
      timestamp: new Date().toISOString(),
      read: false,
      starred: false,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing incoming email:", error)
    return NextResponse.json({ error: "Failed to process email" }, { status: 500 })
  }
}
