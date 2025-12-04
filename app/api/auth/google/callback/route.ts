import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { exchangeCodeForTokens, getGoogleUserInfo, findOrCreateGoogleUser } from "@/lib/google-auth"
import { createSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error || !code) {
    return NextResponse.redirect(new URL("/login?error=google_auth_failed", request.url))
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)
    if (!tokens) {
      return NextResponse.redirect(new URL("/login?error=token_exchange_failed", request.url))
    }

    // Get user info from Google
    const googleUser = await getGoogleUserInfo(tokens.access_token)
    if (!googleUser) {
      return NextResponse.redirect(new URL("/login?error=userinfo_failed", request.url))
    }

    // Find or create user
    const user = await findOrCreateGoogleUser(googleUser)

    // Create session
    const sessionId = await createSession(user)

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set("session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    })

    return NextResponse.redirect(new URL("/", request.url))
  } catch (error) {
    console.error("Google auth error:", error)
    return NextResponse.redirect(new URL("/login?error=auth_failed", request.url))
  }
}
