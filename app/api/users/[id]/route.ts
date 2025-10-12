import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-middleware"
import { deleteUser, getUserById } from "@/lib/auth-service"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request)

  if (auth.error) {
    return auth.error
  }

  try {
    const { id } = await params
    const user = getUserById(id)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request)

  if (auth.error) {
    return auth.error
  }

  try {
    const { id } = await params

    // Don't allow deleting own account
    if (id === auth.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    const success = deleteUser(id)

    if (!success) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
