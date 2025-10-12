import { type NextRequest, NextResponse } from "next/server"
import { getEmailAttachment } from "@/lib/email-service"
import { allowAnonymous } from "@/lib/auth-middleware"
import { autoAssignEmailToUser, isEmailAssigned } from "@/lib/auth-service"

export async function GET(request: NextRequest, { params }: { params: Promise<{ email: string; attachmentId: string }> }) {
  // Allow both authenticated and anonymous users
  const { user, isAnonymous } = await allowAnonymous(request)

  try {
    const { email, attachmentId } = await params

    if (!email || !attachmentId) {
      return NextResponse.json({ error: "Email and attachment ID parameters are required" }, { status: 400 })
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

    const attachment = await getEmailAttachment(email, attachmentId)

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 })
    }

    // Convert Buffer to proper body type
    const buffer = Buffer.isBuffer(attachment.data) 
      ? Buffer.from(attachment.data) 
      : attachment.data

    return new NextResponse(buffer as any, {
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
