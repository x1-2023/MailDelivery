import { type NextRequest, NextResponse } from "next/server"
import { getEmailsForAddressWithAttachments } from "@/lib/email-service"
import { allowAnonymous } from "@/lib/auth-middleware"
import { autoAssignEmailToUser, isEmailAssigned } from "@/lib/auth-service"

export async function GET(request: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  // Allow both authenticated and anonymous users
  const { user, isAnonymous } = await allowAnonymous(request)

  try {
    const { email } = await params
    const { searchParams } = new URL(request.url)
    const showAccountList = searchParams.get("ADMIN") === process.env.ADMIN

    if (!email) {
      return NextResponse.json({ error: "Email parameter is required" }, { status: 400 })
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
          { status: 403 },
        )
      }
    }
    
    // For anonymous users: check if email is owned by someone
    if (isAnonymous) {
      if (isEmailAssigned(email)) {
        return NextResponse.json(
          { 
            error: "Forbidden", 
            message: "This email address is owned by a registered user. Please login to access it." 
          },
          { status: 403 },
        )
      }
    }

    const emails = await getEmailsForAddressWithAttachments(email)

    const formattedEmails = emails.map((email) => ({
      id: email.id,
      from: email.from,
      to: email.to,
      subject: email.subject,
      body: email.body, // parsed text body
      html: email.html,
      timestamp: email.timestamp,
      read: email.read,
      starred: email.starred,
      attachments:
        email.attachments?.map((att) => ({
          id: att.id,
          filename: att.filename,
          mimeType: att.mimeType,
          size: att.size,
          url: `/api/attachment/${email.to}/${att.id}`,
        })) || [],
    }))

    if (showAccountList) {
      // Return all emails if admin
      return NextResponse.json(formattedEmails)
    }

    return NextResponse.json(formattedEmails)
  } catch (error) {
    console.error("Error fetching emails JSON:", error)
    return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 })
  }
}
