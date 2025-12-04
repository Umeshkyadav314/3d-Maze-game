import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { redis } from "@/lib/redis"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const scoresData = await redis.get(`user:scores:${session.id}`)
    const scores = scoresData ? (typeof scoresData === "string" ? JSON.parse(scoresData) : scoresData) : []

    const stats = {
      totalGames: scores.length,
      highScore: scores.length > 0 ? Math.max(...scores.map((s: { score: number }) => s.score)) : 0,
      bestTime: scores.length > 0 ? Math.min(...scores.map((s: { timeMs: number }) => s.timeMs)) : 0,
      maxLevel: scores.length > 0 ? Math.max(...scores.map((s: { level: number }) => s.level)) : 0,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Stats error:", error)
    return NextResponse.json({ error: "Failed to get stats" }, { status: 500 })
  }
}
