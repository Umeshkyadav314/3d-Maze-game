import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { redis } from "@/lib/redis"

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { username, email, avatarUrl } = await request.json()

    // Get current user data
    const userData = await redis.get(`user:${session.id}`)
    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = typeof userData === "string" ? JSON.parse(userData) : userData

    // Check username availability if changed
    if (username !== user.username) {
      const existingUsername = await redis.get(`user:username:${username}`)
      if (existingUsername) {
        return NextResponse.json({ error: "Username already taken" }, { status: 400 })
      }
      await redis.del(`user:username:${user.username}`)
      await redis.set(`user:username:${username}`, session.id)
    }

    // Check email availability if changed
    if (email !== user.email) {
      const existingEmail = await redis.get(`user:email:${email}`)
      if (existingEmail) {
        return NextResponse.json({ error: "Email already registered" }, { status: 400 })
      }
      await redis.del(`user:email:${user.email}`)
    }

    // Update user
    const updatedUser = {
      ...user,
      username,
      email,
      avatarUrl,
      updatedAt: new Date().toISOString(),
    }

    await redis.set(`user:${session.id}`, JSON.stringify(updatedUser))
    await redis.set(`user:email:${email}`, JSON.stringify(updatedUser))

    return NextResponse.json({
      user: {
        id: session.id,
        username,
        email,
        avatarUrl,
      },
    })
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user data to delete associated keys
    const userData = await redis.get(`user:${session.id}`)
    if (userData) {
      const user = typeof userData === "string" ? JSON.parse(userData) : userData
      await redis.del(`user:email:${user.email}`)
      await redis.del(`user:username:${user.username}`)
    }

    await redis.del(`user:${session.id}`)
    await redis.del(`user:scores:${session.id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
