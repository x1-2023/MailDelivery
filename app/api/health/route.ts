import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Basic health check - return system status
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "Mail Delivery System",
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
