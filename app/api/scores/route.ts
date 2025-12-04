import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { redis, addToLeaderboard } from "@/lib/redis"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { score, level, timeMs } = await request.json()

    if (typeof score !== "number" || typeof level !== "number" || typeof timeMs !== "number") {
      return NextResponse.json({ error: "Invalid score data" }, { status: 400 })
    }

    // Save to user's scores
    const scoresData = await redis.get(`user:scores:${session.id}`)
    const scores = scoresData ? (typeof scoresData === "string" ? JSON.parse(scoresData) : scoresData) : []

    scores.push({
      score,
      level,
      timeMs,
      completedAt: new Date().toISOString(),
    })

    await redis.set(`user:scores:${session.id}`, JSON.stringify(scores))

    // Add to leaderboard
    await addToLeaderboard(session.id, session.username, score, level)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Score submission error:", error)
    return NextResponse.json({ error: "Failed to submit score" }, { status: 500 })
  }
}
