import { Redis } from "@upstash/redis"

export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

// Leaderboard keys
export const LEADERBOARD_KEY = "maze:leaderboard"
export const ONLINE_PLAYERS_KEY = "maze:online"

// Helper functions for Redis operations
export async function addToLeaderboard(userId: string, username: string, score: number, level: number) {
  const member = JSON.stringify({ userId, username, level, timestamp: Date.now() })
  await redis.zadd(LEADERBOARD_KEY, { score, member })
}

export async function getLeaderboard(limit = 10) {
  const results = await redis.zrange(LEADERBOARD_KEY, 0, limit - 1, { rev: true, withScores: true })
  return results
}

export async function setOnlinePlayer(sessionId: string, userId: string, username: string) {
  await redis.hset(ONLINE_PLAYERS_KEY, { [sessionId]: JSON.stringify({ userId, username, lastSeen: Date.now() }) })
  await redis.expire(ONLINE_PLAYERS_KEY, 300) // 5 min expiry
}

export async function getOnlinePlayers() {
  return await redis.hgetall(ONLINE_PLAYERS_KEY)
}

export async function removeOnlinePlayer(sessionId: string) {
  await redis.hdel(ONLINE_PLAYERS_KEY, sessionId)
}

// Cache game state
export async function cacheGameState(sessionId: string, state: object) {
  await redis.set(`game:${sessionId}`, JSON.stringify(state), { ex: 3600 })
}

export async function getGameState(sessionId: string) {
  const state = await redis.get(`game:${sessionId}`)
  return state ? JSON.parse(state as string) : null
}
