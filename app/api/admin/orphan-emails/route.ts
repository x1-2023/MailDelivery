import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-middleware"
import { getOrphanEmails, assignOrphanEmailToUser } from "@/lib/auth-service"

/**
 * GET /api/admin/orphan-emails
 * Get list of orphan emails (emails without owner)
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth.error) {
    return auth.error
  }

  try {
    // Get limit from query params (default 50 for performance)
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const orphanEmails = getOrphanEmails(limit)

    return NextResponse.json({
      success: true,
      emails: orphanEmails,
      count: orphanEmails.length,
      limit: limit,
      note: orphanEmails.length === limit ? 'Showing first ' + limit + ' orphan emails. May have more.' : null
    })
  } catch (error) {
    console.error("Error fetching orphan emails:", error)
    return NextResponse.json({ error: "Failed to fetch orphan emails" }, { status: 500 })
  }
}

/**
 * POST /api/admin/orphan-emails
 * Assign orphan email to a user
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth.error) {
    return auth.error
  }

  try {
    const { email, userId } = await request.json()

    if (!email || !userId) {
      return NextResponse.json({ error: "Email and userId are required" }, { status: 400 })
    }

    const success = assignOrphanEmailToUser(email, userId)

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Email "${email}" has been assigned to user`,
      })
    } else {
      return NextResponse.json({ error: "Failed to assign email" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error assigning orphan email:", error)
    return NextResponse.json({ error: "Failed to assign orphan email" }, { status: 500 })
  }
}
