import { type NextRequest, NextResponse } from "next/server"
import { getRawEmail } from "@/lib/email-service"

export async function GET(request: NextRequest, { params }: { params: { email: string; id: string } }) {
  try {
    const { email, id } = params

    if (!email || !id) {
      return NextResponse.json({ error: "Email and ID parameters are required" }, { status: 400 })
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
