import { type NextRequest, NextResponse } from "next/server"
import { getSpecificEmailWithAttachments } from "@/lib/email-service"

export async function GET(request: NextRequest, { params }: { params: { email: string; id: string } }) {
  try {
    const { email, id } = params

    if (!email || !id) {
      return NextResponse.json({ error: "Email and ID parameters are required" }, { status: 400 })
    }

    const emailData = await getSpecificEmailWithAttachments(email, id)

    if (!emailData) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 })
    }

    const response = {
      id: emailData.id,
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
      body: emailData.body, // parsed text body
      html: emailData.html, // HTML body
      raw: emailData.raw, // raw email content (can be huge)
      timestamp: emailData.timestamp,
      read: emailData.read,
      starred: emailData.starred,
      attachments:
        emailData.attachments?.map((att) => ({
          id: att.id,
          filename: att.filename,
          mimeType: att.mimeType,
          size: att.size,
          url: `/api/attachment/${email}/${att.id}`,
          // Note: attachment data is base64 encoded and can be huge
          data: att.data,
        })) || [],
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching specific email:", error)
    return NextResponse.json({ error: "Failed to fetch email" }, { status: 500 })
  }
}
