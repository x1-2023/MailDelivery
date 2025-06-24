import { type NextRequest, NextResponse } from "next/server"
import { getEmailAttachment } from "@/lib/email-service"

export async function GET(request: NextRequest, { params }: { params: { email: string; attachmentId: string } }) {
  try {
    const { email, attachmentId } = params

    if (!email || !attachmentId) {
      return NextResponse.json({ error: "Email and attachment ID parameters are required" }, { status: 400 })
    }

    const attachment = await getEmailAttachment(email, attachmentId)

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 })
    }

    return new NextResponse(attachment.data, {
      headers: {
        "Content-Type": attachment.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${attachment.filename || `attachment-${attachmentId}`}"`,
        "Content-Length": attachment.size.toString(),
      },
    })
  } catch (error) {
    console.error("Error fetching attachment:", error)
    return NextResponse.json({ error: "Failed to fetch attachment" }, { status: 500 })
  }
}
