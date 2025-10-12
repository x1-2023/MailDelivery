import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-middleware"
import {
  getAllSpamFilters,
  createSpamFilter,
  updateSpamFilter,
  deleteSpamFilter,
  toggleSpamFilter,
  getSpamStats,
  type SpamFilter,
} from "@/lib/spam-filter-service"

// GET: List all spam filters
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error

  try {
    const filters = await getAllSpamFilters()
    const stats = await getSpamStats()

    return NextResponse.json({
      success: true,
      filters,
      stats,
    })
  } catch (error) {
    console.error("Error fetching spam filters:", error)
    return NextResponse.json({ error: "Failed to fetch spam filters" }, { status: 500 })
  }
}

// POST: Create new spam filter
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const { name, filter_type, subject_pattern, sender_pattern, action, auto_delete_minutes, enabled } = body

    // Validation
    if (!name || !filter_type || !action) {
      return NextResponse.json({ error: "Missing required fields: name, filter_type, action" }, { status: 400 })
    }

    if (!["subject", "sender", "both"].includes(filter_type)) {
      return NextResponse.json({ error: "Invalid filter_type. Must be: subject, sender, or both" }, { status: 400 })
    }

    if (!["block", "auto_delete"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Must be: block or auto_delete" }, { status: 400 })
    }

    if (filter_type === "subject" && !subject_pattern) {
      return NextResponse.json({ error: "subject_pattern is required when filter_type is 'subject'" }, { status: 400 })
    }

    if (filter_type === "sender" && !sender_pattern) {
      return NextResponse.json({ error: "sender_pattern is required when filter_type is 'sender'" }, { status: 400 })
    }

    if (filter_type === "both" && (!subject_pattern || !sender_pattern)) {
      return NextResponse.json(
        { error: "Both subject_pattern and sender_pattern are required when filter_type is 'both'" },
        { status: 400 },
      )
    }

    if (action === "auto_delete" && !auto_delete_minutes) {
      return NextResponse.json(
        { error: "auto_delete_minutes is required when action is 'auto_delete'" },
        { status: 400 },
      )
    }

    const filter: SpamFilter = {
      name,
      filter_type,
      subject_pattern,
      sender_pattern,
      action,
      auto_delete_minutes: action === "auto_delete" ? Number.parseInt(auto_delete_minutes) : undefined,
      enabled: enabled ?? 1,
    }

    const filterId = await createSpamFilter(filter)

    return NextResponse.json({
      success: true,
      message: "Spam filter created successfully",
      filterId,
    })
  } catch (error) {
    console.error("Error creating spam filter:", error)
    return NextResponse.json({ error: "Failed to create spam filter" }, { status: 500 })
  }
}

// PUT: Update spam filter
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Filter ID is required" }, { status: 400 })
    }

    await updateSpamFilter(id, updates)

    return NextResponse.json({
      success: true,
      message: "Spam filter updated successfully",
    })
  } catch (error) {
    console.error("Error updating spam filter:", error)
    return NextResponse.json({ error: "Failed to update spam filter" }, { status: 500 })
  }
}

// DELETE: Delete spam filter
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Filter ID is required" }, { status: 400 })
    }

    await deleteSpamFilter(Number.parseInt(id))

    return NextResponse.json({
      success: true,
      message: "Spam filter deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting spam filter:", error)
    return NextResponse.json({ error: "Failed to delete spam filter" }, { status: 500 })
  }
}

// PATCH: Toggle spam filter enabled status
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const { id, enabled } = body

    if (!id || enabled === undefined) {
      return NextResponse.json({ error: "Filter ID and enabled status are required" }, { status: 400 })
    }

    await toggleSpamFilter(id, enabled)

    return NextResponse.json({
      success: true,
      message: `Spam filter ${enabled ? "enabled" : "disabled"} successfully`,
    })
  } catch (error) {
    console.error("Error toggling spam filter:", error)
    return NextResponse.json({ error: "Failed to toggle spam filter" }, { status: 500 })
  }
}
