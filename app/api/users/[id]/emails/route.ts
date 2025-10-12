import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, requireAuth } from "@/lib/auth-middleware"
import { getUserEmails, assignEmailToUser, removeEmailFromUser } from "@/lib/auth-service"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Allow users to view their own emails OR admin to view any
  const auth = await requireAuth(request)
  
  if (auth.error) {
    return auth.error
  }

  try {
    const { id } = await params
    
    // Users can only view their own emails (unless admin)
    if (auth.user.id !== id && auth.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    const emails = getUserEmails(id)

    return NextResponse.json({
      success: true,
      emails: emails
        .filter((email: any) => email && email.emailAddress) // Filter out invalid entries
        .map((email: any) => ({
          email: email.emailAddress,
          domain: email.emailAddress.includes("@") ? email.emailAddress.split("@")[1] : "",
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Placeholder
        })),
    })
  } catch (error) {
    console.error("Get user emails error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)

  if (auth.error) {
    return auth.error
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { email, emails } = body

    // Support both single email and bulk emails
    const emailList = emails || (email ? [email] : [])

    if (emailList.length === 0) {
      return NextResponse.json({ error: "Email address(es) required" }, { status: 400 })
    }

    // Process each email
    let successCount = 0
    let failCount = 0
    const failedEmails: string[] = []

    for (const emailAddr of emailList) {
      const success = assignEmailToUser(id, emailAddr)
      if (success) {
        successCount++
      } else {
        failCount++
        failedEmails.push(emailAddr)
      }
    }

    return NextResponse.json({
      success: true,
      message:
        emailList.length === 1
          ? successCount > 0
            ? "Email assigned successfully"
            : "Failed to assign email (may already exist)"
          : `Assigned ${successCount} email(s), ${failCount} failed`,
      successCount,
      failCount,
      failedEmails: failCount > 0 ? failedEmails : undefined,
    })
  } catch (error) {
    console.error("Assign email error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)

  if (auth.error) {
    return auth.error
  }

  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 })
    }

    const success = removeEmailFromUser(id, email)

    if (!success) {
      return NextResponse.json({ error: "Email not found for user" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Email removed successfully",
    })
  } catch (error) {
    console.error("Remove email error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
