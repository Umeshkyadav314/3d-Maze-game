import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyOTP } from "@/lib/otp"
import { createSession } from "@/lib/auth"
import { redis } from "@/lib/redis"

export async function POST(request: NextRequest) {
  try {
    const { identifier, type, otp, username } = await request.json()

    if (!identifier || !type || !otp) {
      return NextResponse.json({ error: "Identifier, type, and OTP are required" }, { status: 400 })
    }

    // Verify OTP
    const isValid = await verifyOTP(identifier, type, otp)
    if (!isValid) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 401 })
    }

    // Find or create user based on identifier
    const userKey = type === "email" ? `user:email:${identifier}` : `user:phone:${identifier}`
    const userData = await redis.get(userKey)
    let user

    if (userData) {
      user = typeof userData === "string" ? JSON.parse(userData) : userData
    } else {
      // Create new user
      const userId = crypto.randomUUID()
      const defaultUsername = username || `user_${userId.slice(0, 8)}`

      user = {
        id: userId,
        email: type === "email" ? identifier : null,
        phone: type === "phone" ? identifier : null,
        username: defaultUsername,
        provider: type,
        createdAt: new Date().toISOString(),
      }

      // Store user
      await redis.set(`user:${userId}`, JSON.stringify(user))
      await redis.set(userKey, JSON.stringify(user))
    }

    // Create session
    const sessionId = await createSession({
      id: user.id,
      email: user.email || "",
      username: user.username,
      avatarUrl: user.avatarUrl,
    })

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set("session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
      },
      isNewUser: !userData,
    })
  } catch (error) {
    console.error("Verify OTP error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
