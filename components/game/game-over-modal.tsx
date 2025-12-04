"use client"

import { useGame } from "@/contexts/game-context"
import { useUser } from "@/contexts/user-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Timer, Zap, RotateCcw, Home, ArrowRight } from "lucide-react"

export default function GameOverModal() {
  const { gameState, level, score, timeElapsed, startGame, resetGame } = useGame()
  const { user } = useUser()

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const handleSubmitScore = async () => {
    if (!user) return

    try {
      await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, level, timeMs: timeElapsed * 1000 }),
      })
    } catch (error) {
      console.error("Failed to submit score:", error)
    }
  }

  if (gameState !== "won" && gameState !== "gameover") return null

  const isWin = gameState === "won"

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className={`text-3xl ${isWin ? "text-green-500" : "text-red-500"}`}>
            {isWin ? "Maze Complete!" : "Game Over"}
          </CardTitle>
          <CardDescription>{isWin ? "Congratulations! You found the exit!" : "The zombies got you..."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-muted rounded-lg p-3">
              <Trophy className="w-6 h-6 mx-auto mb-1 text-amber-500" />
              <p className="text-2xl font-bold">{score}</p>
              <p className="text-xs text-muted-foreground">Score</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <Zap className="w-6 h-6 mx-auto mb-1 text-yellow-500" />
              <p className="text-2xl font-bold">{level}</p>
              <p className="text-xs text-muted-foreground">Level</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <Timer className="w-6 h-6 mx-auto mb-1 text-blue-500" />
              <p className="text-2xl font-bold">{formatTime(timeElapsed)}</p>
              <p className="text-xs text-muted-foreground">Time</p>
            </div>
          </div>

          {user && isWin && (
            <Button className="w-full" onClick={handleSubmitScore}>
              Submit to Leaderboard
            </Button>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={resetGame}>
            <Home className="w-4 h-4 mr-2" />
            Menu
          </Button>
          {isWin ? (
            <Button className="flex-1" onClick={() => startGame(level + 1)}>
              Next Level
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button className="flex-1" onClick={() => startGame(level)}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
