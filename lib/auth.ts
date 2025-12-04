import { cookies } from "next/headers"
import { redis } from "./redis"

export type SessionUser = {
  id: string
  email: string
  username: string
  avatarUrl?: string
}

export async function createSession(user: SessionUser): Promise<string> {
  const sessionId = crypto.randomUUID()
  await redis.set(`session:${sessionId}`, JSON.stringify(user), { ex: 60 * 60 * 24 * 7 }) // 7 days
  return sessionId
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("session")?.value
  if (!sessionId) return null

  const session = await redis.get(`session:${sessionId}`)
  if (!session) return null

  return typeof session === "string" ? JSON.parse(session) : (session as SessionUser)
}

export async function deleteSession(sessionId: string) {
  await redis.del(`session:${sessionId}`)
}

export function hashPassword(password: string): string {
  // Simple hash for demo - in production use bcrypt
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return hash.toString(16) + password.length.toString(16)
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}
