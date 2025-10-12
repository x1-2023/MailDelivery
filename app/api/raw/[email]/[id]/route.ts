import { type NextRequest, NextResponse } from "next/server"
import { getRawEmail } from "@/lib/email-service"
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

    const rawEmail = await getRawEmail(email, id)

    if (!rawEmail) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 })
    }

    return new NextResponse(rawEmail.raw, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="email-${id}.eml"`,
      },
    })
  } catch (error) {
    console.error("Error fetching raw email:", error)
    return NextResponse.json({ error: "Failed to fetch raw email" }, { status: 500 })
  }
}
