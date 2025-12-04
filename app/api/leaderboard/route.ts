import { NextResponse } from "next/server"
import { getLeaderboard } from "@/lib/redis"

export async function GET() {
  try {
    const results = await getLeaderboard(20)

    const entries = []
    for (let i = 0; i < results.length; i += 2) {
      const member = results[i]
      const score = results[i + 1]

      if (typeof member === "string") {
        try {
          const parsed = JSON.parse(member)
          entries.push({
            rank: Math.floor(i / 2) + 1,
            username: parsed.username,
            score: Number(score),
            level: parsed.level,
          })
        } catch {
          // Skip invalid entries
        }
      }
    }

    return NextResponse.json({ entries })
  } catch (error) {
    console.error("Leaderboard error:", error)
    return NextResponse.json({ entries: [] })
  }
}
