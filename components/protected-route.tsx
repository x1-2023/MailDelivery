"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "./auth-provider"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login")
      } else if (requireAdmin && user.role !== "admin") {
        router.push("/")
      }
    }
  }, [user, isLoading, requireAdmin, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (requireAdmin && user.role !== "admin") {
    return null
  }

  return <>{children}</>
}
