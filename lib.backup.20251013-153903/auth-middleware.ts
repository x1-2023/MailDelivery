import { NextRequest, NextResponse } from "next/server"
import { validateSession } from "./auth-service"
import { parseBasicAuth, parseBearerToken, parseSimpleAuth } from "./password"
import { authenticateUser } from "./auth-service"

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    username: string
    role: "admin" | "user"
  }
}

/**
 * Middleware to check authentication
 * Supports Bearer token, Basic auth, and Simple auth (username:password)
 */
export async function requireAuth(
  request: NextRequest,
  requiredRole?: "admin" | "user",
): Promise<{ user: any; error?: never } | { user?: never; error: NextResponse }> {
  const authHeader = request.headers.get("authorization")
  const cookieToken = request.cookies.get("session_token")?.value

  let user = null

  // Try Bearer token from header
  if (authHeader?.startsWith("Bearer ")) {
    const token = parseBearerToken(authHeader)
    if (token) {
      user = validateSession(token)
    }
  }
  // Try Bearer token from cookie
  else if (cookieToken) {
    user = validateSession(cookieToken)
  }
  // Try Basic auth
  else if (authHeader?.startsWith("Basic ")) {
    const credentials = parseBasicAuth(authHeader)
    if (credentials) {
      const authResult = await authenticateUser(credentials.username, credentials.password)
      if (authResult) {
        user = authResult.user
      }
    }
  }
  // Try Simple auth (username:password)
  else if (authHeader) {
    const credentials = parseSimpleAuth(authHeader)
    if (credentials) {
      const authResult = await authenticateUser(credentials.username, credentials.password)
      if (authResult) {
        user = authResult.user
      }
    }
  }

  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized", message: "Authentication required" }, { status: 401 }),
    }
  }

  // Check role if required
  if (requiredRole && user.role !== requiredRole && user.role !== "admin") {
    return {
      error: NextResponse.json(
        { error: "Forbidden", message: "Insufficient permissions" },
        { status: 403 },
      ),
    }
  }

  return { user }
}

/**
 * Middleware to check if user is admin
 */
export async function requireAdmin(request: NextRequest) {
  return requireAuth(request, "admin")
}

/**
 * Get authenticated user from request (optional)
 */
export async function getAuthUser(request: NextRequest) {
  const result = await requireAuth(request)
  return result.user || null
}

/**
 * Allow both authenticated users and anonymous access
 * Returns user if authenticated, null if anonymous
 */
export async function allowAnonymous(
  request: NextRequest,
): Promise<{ user: any | null; isAnonymous: boolean }> {
  const authHeader = request.headers.get("authorization")
  const cookieToken = request.cookies.get("session_token")?.value

  let user = null

  // Try Bearer token from header
  if (authHeader?.startsWith("Bearer ")) {
    const token = parseBearerToken(authHeader)
    if (token) {
      user = validateSession(token)
    }
  }
  // Try Bearer token from cookie
  else if (cookieToken) {
    user = validateSession(cookieToken)
  }
  // Try Basic auth
  else if (authHeader?.startsWith("Basic ")) {
    const credentials = parseBasicAuth(authHeader)
    if (credentials) {
      const authResult = await authenticateUser(credentials.username, credentials.password)
      if (authResult) {
        user = authResult.user
      }
    }
  }
  // Try Simple auth (username:password)
  else if (authHeader) {
    const credentials = parseSimpleAuth(authHeader)
    if (credentials) {
      const authResult = await authenticateUser(credentials.username, credentials.password)
      if (authResult) {
        user = authResult.user
      }
    }
  }

  return {
    user,
    isAnonymous: !user,
  }
}
