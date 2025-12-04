"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Target, Timer, Zap } from "lucide-react"

type Stats = {
  totalGames: number
  highScore: number
  bestTime: number
  maxLevel: number
}

export default function UserStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/users/me/stats")
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  const formatTime = (ms: number) => {
    if (!ms) return "N/A"
    const seconds = Math.floor(ms / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading stats...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Your Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted rounded-lg p-4 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{stats?.totalGames || 0}</p>
            <p className="text-sm text-muted-foreground">Games Played</p>
          </div>
          <div className="bg-muted rounded-lg p-4 text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-amber-500" />
            <p className="text-2xl font-bold">{stats?.highScore?.toLocaleString() || 0}</p>
            <p className="text-sm text-muted-foreground">High Score</p>
          </div>
          <div className="bg-muted rounded-lg p-4 text-center">
            <Timer className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{formatTime(stats?.bestTime || 0)}</p>
            <p className="text-sm text-muted-foreground">Best Time</p>
          </div>
          <div className="bg-muted rounded-lg p-4 text-center">
            <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">{stats?.maxLevel || 0}</p>
            <p className="text-sm text-muted-foreground">Max Level</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
