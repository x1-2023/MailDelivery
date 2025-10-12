import { type NextRequest, NextResponse } from "next/server"
import { getEmailsForAddress } from "@/lib/email-service"
import { allowAnonymous } from "@/lib/auth-middleware"
import { autoAssignEmailToUser, isEmailAssigned } from "@/lib/auth-service"

export async function GET(request: NextRequest) {
  // Allow both authenticated and anonymous users
  const { user, isAnonymous } = await allowAnonymous(request)

  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

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
    
    // For anonymous users: check if email is already owned by someone
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

    const emails = await getEmailsForAddress(email)

    return NextResponse.json({ emails })
  } catch (error) {
    console.error("Error fetching emails:", error)
    return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 })
  }
}
