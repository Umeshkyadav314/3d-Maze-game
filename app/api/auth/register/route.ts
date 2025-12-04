import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { redis } from "@/lib/redis"
import { createSession, hashPassword } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json()

    if (!username || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Check if user exists
    const existingByEmail = await redis.get(`user:email:${email}`)
    if (existingByEmail) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 })
    }

    const existingByUsername = await redis.get(`user:username:${username}`)
    if (existingByUsername) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 })
    }

    const userId = crypto.randomUUID()
    const user = {
      id: userId,
      username,
      email,
      passwordHash: hashPassword(password),
      avatarUrl: null,
      createdAt: new Date().toISOString(),
    }

    // Store user data in Redis
    await redis.set(`user:${userId}`, JSON.stringify(user))
    await redis.set(`user:email:${email}`, JSON.stringify(user))
    await redis.set(`user:username:${username}`, userId)

    const sessionId = await createSession({
      id: userId,
      email,
      username,
      avatarUrl: undefined,
    })

    const cookieStore = await cookies()
    cookieStore.set("session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    })

    return NextResponse.json({
      user: { id: userId, email, username, avatarUrl: null },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
