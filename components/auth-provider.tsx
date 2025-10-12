"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  username: string
  role: "admin" | "user"
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const storedUser = localStorage.getItem("user")
      const storedToken = localStorage.getItem("token")

      if (storedUser && storedToken) {
        try {
          // Validate session
          const response = await fetch("/api/auth/session", {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          })

          if (response.ok) {
            const data = await response.json()
            setUser(data.user)
            setToken(storedToken)
          } else {
            // Session invalid, clear storage
            localStorage.removeItem("user")
            localStorage.removeItem("token")
          }
        } catch (error) {
          console.error("Session check failed:", error)
          localStorage.removeItem("user")
          localStorage.removeItem("token")
        }
      }

      setIsLoading(false)
    }

    checkSession()
  }, [])

  const login = async (username: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || "Login failed")
    }

    const data = await response.json()
    setUser(data.user)
    setToken(data.token)
    localStorage.setItem("user", JSON.stringify(data.user))
    localStorage.setItem("token", data.token)

    // Redirect based on role
    if (data.user.role === "admin") {
      router.push("/admin")
    } else {
      router.push("/")
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    } catch (error) {
      console.error("Logout error:", error)
    }

    setUser(null)
    setToken(null)
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
