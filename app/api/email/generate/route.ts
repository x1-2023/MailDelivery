import { type NextRequest, NextResponse } from "next/server"
import { generateRandomEmail, createTempEmail } from "@/lib/email-service"
import { allowAnonymous } from "@/lib/auth-middleware"
import { assignEmailToUser } from "@/lib/auth-service"

export async function POST(request: NextRequest) {
  // Allow both authenticated and anonymous users
  const { user, isAnonymous } = await allowAnonymous(request)

  try {
    const body = await request.json().catch(() => ({}))
    const { customEmail } = body

    // Get domains from environment variable
    const domains = process.env.DOMAINS?.split(",").map((d) => d.trim()) || ["tempmail.local"]

    let email
    if (customEmail && customEmail.trim()) {
      // Validate custom email
      if (customEmail.includes("@")) {
        const domain = customEmail.split("@")[1]
        if (!domains.includes(domain)) {
          return NextResponse.json(
            {
              error: `Domain not allowed. Allowed domains: ${domains.join(", ")}`,
            },
            { status: 400 },
          )
        }
        email = customEmail
      } else {
        // Add first domain to custom username
        email = `${customEmail}@${domains[0]}`
      }

      // Check if email is already owned by someone
      const { isEmailAssigned, userOwnsEmail } = await import("@/lib/auth-service")
      
      if (isEmailAssigned(email)) {
        // Email is owned by someone
        if (isAnonymous) {
          // Anonymous cannot create email that's owned
          return NextResponse.json(
            {
              error: `Email address "${email}" is already in use by a registered user`,
            },
            { status: 409 }, // 409 Conflict
          )
        } else {
          // Authenticated user - check if they own it
          if (!userOwnsEmail(user.id, email)) {
            return NextResponse.json(
              {
                error: `Email address "${email}" is already in use by another user`,
              },
              { status: 409 }, // 409 Conflict
            )
          }
          // User already owns this email, just return it
          const existingEmail = {
            email,
            domain: email.split("@")[1],
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          }
          return NextResponse.json(existingEmail)
        }
      }
      // Email is orphan or doesn't exist - allow creation for both anonymous and authenticated
    } else {
      // Generate random email with random domain
      const domain = domains[Math.floor(Math.random() * domains.length)]
      email = generateRandomEmail(domain)
    }

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hours expiry

    const tempEmail = await createTempEmail({
      email,
      domain: email.split("@")[1],
      expiresAt: expiresAt.toISOString(),
      userId: isAnonymous ? null : user.id, // null for anonymous, user ID for authenticated
    })

    // Assign email to user (only if authenticated)
    if (!isAnonymous && user) {
      assignEmailToUser(user.id, email)
    }

    return NextResponse.json(tempEmail)
  } catch (error) {
    console.error("Error generating email:", error)
    return NextResponse.json({ error: "Failed to generate email" }, { status: 500 })
  }
}
