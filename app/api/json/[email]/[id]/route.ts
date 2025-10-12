import { type NextRequest, NextResponse } from "next/server"
import { getSpecificEmailWithAttachments } from "@/lib/email-service"
import { allowAnonymous } from "@/lib/auth-middleware"
import { autoAssignEmailToUser, isEmailAssigned } from "@/lib/auth-service"

export async function GET(request: NextRequest, { params }: { params: Promise<{ email: string; id: string }> }) {
  // Allow both authenticated and anonymous users
  const { user, isAnonymous } = await allowAnonymous(request)

  try {
    const { email, id } = await params

    if (!email || !id) {
      return NextResponse.json({ error: "Email and ID parameters are required" }, { status: 400 })
    }

    // For authenticated users (not admin): auto-assign email or check ownership
    if (!isAnonymous && user.role !== "admin") {
      const hasAccess = autoAssignEmailToUser(user.id, email)
      
      if (!hasAccess) {
        return NextResponse.json(
          { 
            error: "Forbidden", 
            message: "This email address is already owned by another user." 
          },
          { status: 403 }
        )
      }
    }
    
    // For anonymous users: check if email is owned
    if (isAnonymous) {
      if (isEmailAssigned(email)) {
        return NextResponse.json(
          { 
            error: "Forbidden", 
            message: "This email address is owned by a registered user. Please login to access it." 
          },
          { status: 403 }
        )
      }
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
