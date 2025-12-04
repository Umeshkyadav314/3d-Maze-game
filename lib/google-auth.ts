import { redis } from "./redis"
import type { SessionUser } from "./auth"

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

export function getGoogleAuthUrl(): string {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/google/callback`

  const params = new URLSearchParams({
    client_id: clientId || "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string): Promise<{ access_token: string; id_token: string } | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/google/callback`

  try {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId || "",
        client_secret: clientSecret || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    })

    if (!response.ok) return null
    return response.json()
  } catch {
    return null
  }
}

export async function getGoogleUserInfo(accessToken: string): Promise<{
  id: string
  email: string
  name: string
  picture: string
} | null> {
  try {
    const response = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!response.ok) return null
    return response.json()
  } catch {
    return null
  }
}

export async function findOrCreateGoogleUser(googleUser: {
  id: string
  email: string
  name: string
  picture: string
}): Promise<SessionUser> {
  // Check if user exists by Google ID
  const existingByGoogleId = await redis.get(`user:google:${googleUser.id}`)
  if (existingByGoogleId) {
    const user = typeof existingByGoogleId === "string" ? JSON.parse(existingByGoogleId) : existingByGoogleId
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
    }
  }

  // Check if user exists by email
  const existingByEmail = await redis.get(`user:email:${googleUser.email}`)
  if (existingByEmail) {
    const user = typeof existingByEmail === "string" ? JSON.parse(existingByEmail) : existingByEmail
    // Link Google account to existing user
    await redis.set(`user:google:${googleUser.id}`, JSON.stringify(user))
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
    }
  }

  // Create new user
  const userId = crypto.randomUUID()
  const username = googleUser.name.toLowerCase().replace(/\s+/g, "_") + "_" + userId.slice(0, 4)

  const newUser = {
    id: userId,
    email: googleUser.email,
    username,
    avatarUrl: googleUser.picture,
    googleId: googleUser.id,
    provider: "google",
    createdAt: new Date().toISOString(),
  }

  // Store user data
  await redis.set(`user:${userId}`, JSON.stringify(newUser))
  await redis.set(`user:email:${googleUser.email}`, JSON.stringify(newUser))
  await redis.set(`user:google:${googleUser.id}`, JSON.stringify(newUser))

  return {
    id: userId,
    email: newUser.email,
    username: newUser.username,
    avatarUrl: newUser.avatarUrl,
  }
}
