import { type NextRequest, NextResponse } from "next/server"
import { generateRandomEmail, createTempEmail } from "@/lib/email-service"

export async function POST(request: NextRequest) {
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
    })

    return NextResponse.json(tempEmail)
  } catch (error) {
    console.error("Error generating email:", error)
    return NextResponse.json({ error: "Failed to generate email" }, { status: 500 })
  }
}
