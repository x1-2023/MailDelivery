import { NextResponse } from "next/server"
import { getDatabaseStats, countTempEmails } from "@/lib/temp-email-service"

/**
 * GET /api/admin/database-stats
 * Get statistics about dual database setup
 */
export async function GET() {
  try {
    const stats = getDatabaseStats()
    const counts = countTempEmails()

    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        summary: {
          total_unique_temp_emails: counts.total,
          auth_db_count: counts.auth,
          emails_db_count: counts.emails,
          duplicates: (counts.auth + counts.emails) - counts.total,
        }
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to get database stats", message: error.message },
      { status: 500 }
    )
  }
}
